import { WebPlugin } from "@capacitor/core";
import { NativeBiometricPlugin, AvailableResult, BiometricOptions, GetCredentialOptions, SetCredentialOptions, DeleteCredentialOptions, Credentials } from "./definitions";
export declare class NativeBiometricWeb extends WebPlugin implements NativeBiometricPlugin {
    constructor();
    isAvailable(): Promise<AvailableResult>;
    verifyIdentity(_options?: BiometricOptions): Promise<void>;
    getCredentials(_options: GetCredentialOptions): Promise<Credentials>;
    setCredentials(_options: SetCredentialOptions): Promise<void>;
    deleteCredentials(_options: DeleteCredentialOptions): Promise<void>;
}
