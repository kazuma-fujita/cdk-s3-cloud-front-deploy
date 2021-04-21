import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";

export class CdkS3CloudFrontDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = "sample-bucket";
    const originBucket = new s3.Bucket(this, "S3Bucket", {
      bucketName: bucketName,
      // Bucketへの直接アクセスを禁止
      accessControl: s3.BucketAccessControl.PRIVATE,
      // CDK Stack削除時にBucketも削除する
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
