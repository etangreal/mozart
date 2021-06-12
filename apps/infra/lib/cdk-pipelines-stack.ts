import * as codepipeline from '@aws-cdk/aws-codepipeline';
import {Artifact} from '@aws-cdk/aws-codepipeline';
import * as cp from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import {Construct, SecretValue, Stack, StackProps} from '@aws-cdk/core';
import {CdkPipeline, SimpleSynthAction} from "@aws-cdk/pipelines";
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
        const cloudAssemblyArtifact = new codepipeline.Artifact('assembly');
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub',
            output: sourceArtifact,
            oauthToken: SecretValue.secretsManager('github-token', {jsonField: 'github-token'}),
            owner: 'etangreal',
            repo: 'mozart',
        });

        const cdkSynthAction = SimpleSynthAction.standardYarnSynth({
            sourceArtifact,
            cloudAssemblyArtifact,
            installCommand: 'yarn install --frozen-lockfile',
            // We need a build step to compile the TypeScript CDK
            buildCommand: 'npx nx run infra:build',
            synthCommand: 'npx nx run infra:synth'
        });

        const codePipeline = new cp.Pipeline(this, 'CodePipeline', {
            pipelineName: 'BlogPipeline',
            crossAccountKeys: false, // https://docs.aws.amazon.com/cdk/api/latest/docs/pipelines-readme.html#a-note-on-cost
            restartExecutionOnUpdate: false,
            stages: [
                {
                    stageName: 'SourceAction',
                    actions: [sourceAction],
                },
                {
                    stageName: 'BuildAction',
                    actions: [cdkSynthAction],
                }
            ],
        });

        const cdkPipeline = new CdkPipeline(this, 'Pipeline', {
            codePipeline,
            cloudAssemblyArtifact,
            selfMutating: false});

        return cdkPipeline;
    }
}