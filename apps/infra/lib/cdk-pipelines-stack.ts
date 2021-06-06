import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import {Construct, SecretValue, Stack, StackProps} from '@aws-cdk/core';
import {CdkPipeline, SimpleSynthAction} from "@aws-cdk/pipelines";

/**
 * The stack that defines the application pipeline
 */
export class CdkpipelinesDemoPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const sourceArtifact = new codepipeline.Artifact();
        const cloudAssemblyArtifact = new codepipeline.Artifact();

        const pipeline = new CdkPipeline(this, 'Pipeline', {
            // The pipeline name
            pipelineName: 'BlogPipeline',
            cloudAssemblyArtifact,

            // Where the source can be found
            sourceAction: new codepipeline_actions.GitHubSourceAction({
                actionName: 'GitHub',
                output: sourceArtifact,
                oauthToken: SecretValue.secretsManager('github-token', {jsonField: 'github-token'}),
                owner: 'etangreal',
                repo: 'mozart',
            }),

            // How it will be built and synthesized
            synthAction: SimpleSynthAction.standardYarnSynth({
                sourceArtifact,
                cloudAssemblyArtifact,
                installCommand: [
                    'yarn install --frozen-lockfile'
                ].join(' && '),
                // We need a build step to compile the TypeScript CDK
                buildCommand: [
                    'npx nx run infra:build',
                ].join(' && '),
                synthCommand: 'npx nx run infra:synth'
            }),
        });

        // This is where we add the application stages
        // ...
    }
}