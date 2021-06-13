import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as cp from '@aws-cdk/aws-codepipeline';
import {Artifact} from '@aws-cdk/aws-codepipeline';
import * as cb from '@aws-cdk/aws-codebuild';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import {CodeBuildAction} from '@aws-cdk/aws-codepipeline-actions';
import {Construct, SecretValue, Stack, StackProps} from '@aws-cdk/core';
import {CdkPipeline} from "@aws-cdk/pipelines";
import {StaticSiteInfrastructureStage} from "./static-site-infrastructure-stage";

/**
 * The stack that defines the application pipeline
 */
export class CdkpipelinesDemoPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const sourceArtifact = new codepipeline.Artifact('source');

        const pipeline = this.getCdkPipeline(sourceArtifact);

        // This is where we add the application stages
        pipeline.addApplicationStage(new StaticSiteInfrastructureStage(this, 'SiteInfrastructure'));
    }

    private getCdkPipeline(sourceArtifact: Artifact) {
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub',
            output: sourceArtifact,
            oauthToken: SecretValue.secretsManager('github-token', {jsonField: 'github-token'}),
            owner: 'etangreal',
            repo: 'mozart',
        });

        const build = this.getBuildAction(sourceArtifact);

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
            selfMutating: true});

        return cdkPipeline;
    }

    private getBuildAction(inSourceArtifact: Artifact) :{
        buildAction: cp.Action;
        outCloudAssemblyArtifact: Artifact;
    } {
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
                        ],
                    },
                },
                artifacts: {
                    // store the entire Cloud Assembly as the output artifact
                    "base-directory": "cdk.out",
                    files: "**/*",
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

        const buildAction = new CodeBuildAction({
            actionName: 'Build',
            project: pipelineBuildProject,
            input: inSourceArtifact,
            outputs: [cloudAssemblyArtifact],
            runOrder: 1
        });

        return {buildAction, outCloudAssemblyArtifact: cloudAssemblyArtifact};
    }
}