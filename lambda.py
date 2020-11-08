from __future__ import print_function
import base64
import json
import boto3
import os
import datetime
import time
from botocore.exceptions import ClientError

bucket='vectortrackersagemaker'
webm_names=''
s3 = boto3.client('s3')

def lambda_handler(event, context):
  global webm_names
  for record in event['Records']:
    payload = base64.b64decode(record['kinesis']['data'])
    result = json.loads(payload)
    fragment = result['fragmentMetaData']
    
    frag_id = fragment[17:-1].split(",")[0].split("=")[1]
    srv_ts = datetime.datetime.fromtimestamp(float(fragment[17:-1].split(",")[1].split("=")[1])/1000)
    srv_ts1 = srv_ts.strftime("%A, %d %B %Y %H:%M:%S")
    
    frame = result['frameMetaData']
    streamName = result['streamName']
   
    sageMakerOutput = json.loads(base64.b64decode(result['sageMakerOutput']))
    for i in range(len(sageMakerOutput)):
      if sageMakerOutput[i]['score'] > 0.6:
        print("detected object: " + sageMakerOutput[i]['id'] + ", with probability: " + str(sageMakerOutput[i]['score']))
    
    detections={}
    detections['StreamName']=streamName
    detections['fragmentMetaData']=fragment
    detections['frameMetaData']=frame
    detections['sageMakerOutput']=sageMakerOutput
    
    kv = boto3.client('kinesisvideo')
    get_ep = kv.get_data_endpoint(StreamName=streamName, APIName='GET_MEDIA_FOR_FRAGMENT_LIST')
    kvam_ep = get_ep['DataEndpoint']
    kvam = boto3.client('kinesis-video-archived-media', endpoint_url=kvam_ep)
    getmedia = kvam.get_media_for_fragment_list(
                            StreamName=streamName,
                            Fragments=[frag_id])
    base_key=streamName+"_"+time.strftime("%Y%m%d-%H%M%S")
    webm_key=base_key+'.webm'
    text_key=base_key+'.txt'
    s3.put_object(Bucket=bucket, Key='webms/' + webm_key, Body=getmedia['Payload'].read())
    s3.put_object(Bucket=bucket, Key='texts/' + text_key, Body=json.dumps(detections))
    webm_names += webm_key + '\n'
    print("Detection details and fragment stored in the S3 bucket "+bucket+" with object names : "+webm_key+" & "+text_key)
  
  new_names = s3.get_object(Bucket=bucket, Key='names.txt')['Body'].read() + webm_names
  s3.put_object(Bucket=bucket, Key='names.txt', Body=new_names)
  
  return 'Successfully processed {} records.'.format(len(event['Records']))
