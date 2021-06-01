import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { StaticSiteStack } from '../lib/static-site-stack';

const main = new cdk.App();
new StaticSiteStack(main, 'SrcStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
   env: { region: 'us-east-1' },
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.


  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
