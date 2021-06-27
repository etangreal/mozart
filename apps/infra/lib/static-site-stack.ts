import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import route53 = require('@aws-cdk/aws-route53');

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = this.node.tryGetContext('domain');
    const siteSubDomain = this.node.tryGetContext('subdomain');

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domainName });
    const siteDomain = siteSubDomain + '.' + domainName;
    // new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

    // Content bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,

      // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
      // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
      // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // TLS certificate
    // const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
    //     domainName: siteDomain,
    //     hostedZone: zone,
    //     region: 'us-east-1', // Cloudfront only checks this region for certificates.
    // }).certificateArn;
    // new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    // CloudFront distribution that provides HTTPS
    // const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
    //     aliasConfiguration: {
    //         acmCertRef: certificateArn,
    //         names: [ siteDomain ],
    //         sslMethod: cloudfront.SSLMethod.SNI,
    //         securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
    //     },
    //     originConfigs: [
    //         {
    //             customOriginSource: {
    //                 domainName: siteBucket.bucketWebsiteDomainName,
    //                 originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    //             },
    //             behaviors : [ {isDefaultBehavior: true}],
    //         }
    //     ]
    // });
    // new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // Route53 alias record for the CloudFront distribution
    // new route53.ARecord(this, 'SiteAliasRecord', {
    //     recordName: siteDomain,
    //     target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    //     zone
    // });
    // const cName = new route53.CnameRecord(this, 'SiteCnameRecord', {
    //   zone: zone,
    //   recordName: 'blog',
    //   domainName: siteDomain
    // });
  }
}

