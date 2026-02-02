export var BiometryType;
(function (BiometryType) {
    // Android, iOS
    BiometryType[BiometryType["NONE"] = 0] = "NONE";
    // iOS
    BiometryType[BiometryType["TOUCH_ID"] = 1] = "TOUCH_ID";
    // iOS
    BiometryType[BiometryType["FACE_ID"] = 2] = "FACE_ID";
    // Android
    BiometryType[BiometryType["FINGERPRINT"] = 3] = "FINGERPRINT";
    // Android
    BiometryType[BiometryType["FACE_AUTHENTICATION"] = 4] = "FACE_AUTHENTICATION";
    // Android
    BiometryType[BiometryType["IRIS_AUTHENTICATION"] = 5] = "IRIS_AUTHENTICATION";
    // Android
    BiometryType[BiometryType["MULTIPLE"] = 6] = "MULTIPLE";
})(BiometryType || (BiometryType = {}));
/**
 * Keep this in sync with BiometricAuthError in README.md
 * Update whenever `convertToPluginErrorCode` functions are modified
 */
export var BiometricAuthError;
(function (BiometricAuthError) {
    BiometricAuthError[BiometricAuthError["UNKNOWN_ERROR"] = 0] = "UNKNOWN_ERROR";
    BiometricAuthError[BiometricAuthError["BIOMETRICS_UNAVAILABLE"] = 1] = "BIOMETRICS_UNAVAILABLE";
    BiometricAuthError[BiometricAuthError["USER_LOCKOUT"] = 2] = "USER_LOCKOUT";
    BiometricAuthError[BiometricAuthError["BIOMETRICS_NOT_ENROLLED"] = 3] = "BIOMETRICS_NOT_ENROLLED";
    BiometricAuthError[BiometricAuthError["USER_TEMPORARY_LOCKOUT"] = 4] = "USER_TEMPORARY_LOCKOUT";
    BiometricAuthError[BiometricAuthError["AUTHENTICATION_FAILED"] = 10] = "AUTHENTICATION_FAILED";
    BiometricAuthError[BiometricAuthError["APP_CANCEL"] = 11] = "APP_CANCEL";
    BiometricAuthError[BiometricAuthError["INVALID_CONTEXT"] = 12] = "INVALID_CONTEXT";
    BiometricAuthError[BiometricAuthError["NOT_INTERACTIVE"] = 13] = "NOT_INTERACTIVE";
    BiometricAuthError[BiometricAuthError["PASSCODE_NOT_SET"] = 14] = "PASSCODE_NOT_SET";
    BiometricAuthError[BiometricAuthError["SYSTEM_CANCEL"] = 15] = "SYSTEM_CANCEL";
    BiometricAuthError[BiometricAuthError["USER_CANCEL"] = 16] = "USER_CANCEL";
    BiometricAuthError[BiometricAuthError["USER_FALLBACK"] = 17] = "USER_FALLBACK";
})(BiometricAuthError || (BiometricAuthError = {}));
//# sourceMappingURL=definitions.js.map