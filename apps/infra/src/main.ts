import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {CdkpipelinesDemoPipelineStack} from '../lib/cdk-pipelines-stack';

// Used for debugging
const props = process.env.SET_CONTEXT === 'true' ?  {
        context :{'@aws-cdk/core:newStyleStackSynthesis': true}
    } : undefined;

const app = new cdk.App(props);

new CdkpipelinesDemoPipelineStack(app, 'BlogPipelineStack', {
    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */

    /* Uncomment the next line to specialize this stack for the AWS Account
     * and Region that are implied by the current CLI configuration. */
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

    /* Uncomment the next line if you know exactly what Account and Region you
     * want to deploy the stack to. */
    env: {region: 'us-east-1', account: '090470473446'},
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.

    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

app.synth();