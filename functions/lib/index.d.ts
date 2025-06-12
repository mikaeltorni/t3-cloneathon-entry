/**
 * index.ts
 *
 * Main Firebase Cloud Functions entry point
 *
 * Functions:
 *   helloWorld - Sample HTTP function
 *   scheduledFunction - Sample scheduled function
 *   healthCheck - Health check endpoint
 *
 * Usage: Deploy with `npm run deploy` or test locally with `npm run serve`
 */
/**
 * Sample HTTP Cloud Function
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
export declare const helloWorld: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Health check endpoint for monitoring
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
export declare const healthCheck: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Sample scheduled function that runs every hour
 *
 * @param event - Scheduled event object
 * @returns Promise<void>
 */
export declare const scheduledFunction: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * API endpoint for processing data without database
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
export declare const processData: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Function to get environment information
 *
 * @param request - HTTP request object
 * @param response - HTTP response object
 * @returns void
 */
export declare const getEnvironment: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=index.d.ts.map