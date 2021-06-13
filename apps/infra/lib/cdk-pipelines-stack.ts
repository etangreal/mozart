import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as cp from '@aws-cdk/aws-codepipeline';
import {Artifact} from '@aws-cdk/aws-codepipeline';
import * as cb from '@aws-cdk/aws-codebuild';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import {CodeBuildAction} from '@aws-cdk/aws-codepipeline-actions';
import {Construct, SecretValue, Stack, StackProps} from '@aws-cdk/core';
import {CdkPipeline} from "@aws-cdk/pipelines";
import {StaticSiteInfrastructureStage} from "./static-site-infrastructure-stage";
import {Source} from "@aws-cdk/aws-s3-deployment/lib/source";
import * as s3 from "@aws-cdk/aws-s3";


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
        const blogArtifact = buildPipeLine.buildActionOut.outBlogArtifact;

       const staticSiteStage = new StaticSiteInfrastructureStage(this, 'SiteInfrastructure', {
            blogSource: Source.bucket(s3.Bucket.fromBucketName(this,'sourceBucketName', blogArtifact.bucketName), blogArtifact.artifactName!)
        });

        // This is where we add the application stages
        buildPipeLine.pipeline.addApplicationStage(staticSiteStage);
    }

    private getCdkPipeline(sourceArtifact: Artifact): BuildPipeLine {
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub',
            output: sourceArtifact,
            oauthToken: SecretValue.secretsManager('github-token', {jsonField: 'github-token'}),
            owner: 'etangreal',
            repo: 'mozart',
        });

        const build = this.getBuildStage(sourceArtifact);

        const codePipeline = new cp.Pipeline(this, 'CodePipeline', {
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

        const cdkPipeline = new CdkPipeline(this, 'Pipeline', {
            codePipeline,
            cloudAssemblyArtifact: build.outCloudAssemblyArtifact,
            selfMutating: false // This creates the self mutating UpdatePipeline stage
        });

        return {buildActionOut: build, pipeline: cdkPipeline};
    }

    private getBuildStage(inSourceArtifact: Artifact): BuildAction {
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
                        assembly : {
                            "base-directory": "cdk.out",
                            files: "**/*",
                        },
                        blog : {
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