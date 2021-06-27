import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as cp from '@aws-cdk/aws-codepipeline';
import {Artifact} from '@aws-cdk/aws-codepipeline';
import * as cb from '@aws-cdk/aws-codebuild';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import {CodeBuildAction, GitHubSourceAction, S3DeployAction} from '@aws-cdk/aws-codepipeline-actions';
import {Construct, SecretValue, Stack, StackProps} from '@aws-cdk/core';
import {CdkPipeline} from "@aws-cdk/pipelines";
import {StaticSiteInfrastructureStage} from "./static-site-infrastructure-stage";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";


interface BuildAction {
    buildAction: cp.Action;
    outCloudAssemblyArtifact: Artifact;
    outBlogArtifact: Artifact;
}

interface BuildPipeLine {
    buildActionOut: BuildAction;
    pipeline: CdkPipeline
}

/**
 * The stack that defines the application pipeline
 */
export class CdkpipelinesDemoPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const sourceArtifact = new codepipeline.Artifact('source');

        const buildPipeLine = this.getCdkPipeline(sourceArtifact);
    }

    private getCdkPipeline(sourceArtifact: Artifact): BuildPipeLine {
        const sourceAction = this.getSourceAction(sourceArtifact);

        const buildActionParameters = this.getBuildStageParameters(sourceArtifact);

        const codePipeline = this.getCodePipeline(sourceAction, buildActionParameters);

        const cdkPipeline = new CdkPipeline(this, 'Pipeline', {
            codePipeline,
            cloudAssemblyArtifact: buildActionParameters.outCloudAssemblyArtifact,
            selfMutating: true // This creates the self mutating UpdatePipeline stage
        });

        const preProdStage = new StaticSiteInfrastructureStage(this, 'PreProduction', {
            env: {
                region: this.region,
                account: this.account
            }
        });

        // This is where we add the application stages
        cdkPipeline.addApplicationStage(preProdStage);



        const deployStaticStage = cdkPipeline.addStage('DeployPreProdContents');
        deployStaticStage.addActions(this.deployAction(buildActionParameters.outBlogArtifact, deployStaticStage.nextSequentialRunOrder()))

        return {buildActionOut: buildActionParameters, pipeline: cdkPipeline};
    }

    private getSourceAction(sourceArtifact: Artifact) {
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub',
            output: sourceArtifact,
            oauthToken: SecretValue.secretsManager('github-token', {jsonField: 'github-token'}),
            owner: 'etangreal',
            repo: 'mozart',
        });
        return sourceAction;
    }

    private getCodePipeline(sourceAction: GitHubSourceAction, build: BuildAction) {
        return new cp.Pipeline(this, 'CodePipeline', {
            pipelineName: 'BlogPipeline',
            crossAccountKeys: false, // https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html#a-note-on-cost
            restartExecutionOnUpdate: true,
            stages: [
                {
                    stageName: 'SourceAction',
                    actions: [sourceAction],
                },
                {
                    stageName: 'BuildAction',
                    actions: [build.buildAction],
                }
            ],
        });
    }

    private deployAction(
        buildArtifact: cp.Artifact,
        runOrder: number
    ): S3DeployAction {
        const domainName = this.node.tryGetContext('domain');
        const siteSubDomain = this.node.tryGetContext('subdomain');
        const siteDomain = siteSubDomain + '.' + domainName;

        const bucket = s3.Bucket.fromBucketName(this, "WebsiteBucket", siteDomain);

        return new S3DeployAction({
            actionName: "Deploy",
            runOrder: runOrder,
            input: buildArtifact,
            bucket: bucket,
        });
    }

    private getBuildStageParameters(inSourceArtifact: Artifact): BuildAction {
        const pipelineBuildProject = new cb.PipelineProject(this, 'BuildProject', {
            environment: {
                buildImage: cb.LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: cb.BuildSpec.fromObject({
                version: "0.2",
                phases: {
                    install: {
                        commands: ["yarn install --frozen-lockfile"],
                    },
                    build: {
                        commands: [
                            "npx nx run infra:build",
                            "npx nx run infra:synth",
                            "npx nx run blog:export",
                        ],
                    },
                },
                artifacts: {
                    "secondary-artifacts": {
                        assembly: {
                            "base-directory": "cdk.out",
                            files: "**/*",
                        },
                        blog: {
                            "base-directory": "dist/apps/blog/exported",
                            files: "**/*",
                        }
                    },
                },
                cache: {
                    paths: [
                        '/root/.yarn-cache/**/*',
                        'node_modules/**/*'
                    ]
                }
            })
        });

        pipelineBuildProject.addToRolePolicy(  new iam.PolicyStatement({
            actions: ["route53:ListHostedZonesByName"],
            resources: ["*"]
        }));

        const cloudAssemblyArtifact = new codepipeline.Artifact('assembly');
        const blogArtifact = new codepipeline.Artifact('blog');

        const buildAction = new CodeBuildAction({
            actionName: 'Build',
            project: pipelineBuildProject,
            input: inSourceArtifact,
            outputs: [cloudAssemblyArtifact, blogArtifact],
            runOrder: 1
        });

        return {buildAction, outCloudAssemblyArtifact: cloudAssemblyArtifact, outBlogArtifact: blogArtifact};
    }
}