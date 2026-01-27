#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GoogleSignInModule, NSObject)

RCT_EXTERN_METHOD(signIn:(NSString *)clientId
                  requestId:(NSString *)requestId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signOut:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

