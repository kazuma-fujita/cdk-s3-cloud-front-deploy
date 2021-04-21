import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";

export class CdkS3CloudFrontDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName: string = this.node.tryGetContext("s3").bucketName;
    const bucket = new s3.Bucket(this, "S3Bucket", {
      bucketName: bucketName,
      // Bucketへの直接アクセスを禁止
      accessControl: s3.BucketAccessControl.PRIVATE,
      // publicReadAccess: true,
      // CDK Stack削除時にBucketも削除する
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
    });

    const identity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
      { comment: `${bucket.bucketName} access identity` }
    );

    const bucketPolicyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      effect: iam.Effect.ALLOW,
      principals: [identity.grantPrincipal],
      resources: [`${bucket.bucketArn}/*`],
    });

    bucket.addToResourcePolicy(bucketPolicyStatement);

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "WebDistribution",
      {
        enableIpV6: true,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: identity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
                cachedMethods:
                  cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD,
                forwardedValues: {
                  queryString: false,
                },
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 403,
            responseCode: 200,
            errorCachingMinTtl: 0,
            responsePagePath: "/index.html",
          },
          {
            errorCode: 404,
            responseCode: 200,
            errorCachingMinTtl: 0,
            responsePagePath: "/index.html",
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      }
    );
    new s3deploy.BucketDeployment(this, "S3BucketDeploy", {
      destinationBucket: bucket as s3.IBucket,
      distribution: distribution as cloudfront.IDistribution,
      distributionPaths: ["/*"],
      sources: [s3deploy.Source.asset("./html")],
    });
  }
}
