import { logger } from "@/lib/logger";
import type { WebRTCConfig } from "./types";

/**
 * WebRTC Manager for partner synchronized recording.
 *
 * This is a lightweight signaling client wrapper. Production deployments should ensure:
 * - TLS-only signaling
 * - Authenticated rooms
 * - TURN servers configured for mobile networks
 */
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: WebRTCConfig;
  private onRemoteStream?: (stream: MediaStream) => void;
  private onDataMessage?: (message: unknown) => void;
  private signaling: WebSocket | null = null;

  constructor(
    config: WebRTCConfig,
    onRemoteStream?: (stream: MediaStream) => void,
    onDataMessage?: (message: unknown) => void,
  ) {
    this.config = config;
    this.onRemoteStream = onRemoteStream;
    this.onDataMessage = onDataMessage;
  }

  async initialize(localStream: MediaStream): Promise<void> {
    this.localStream = localStream;

    const iceServers = this.config.iceServers || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    this.peerConnection = new RTCPeerConnection({ iceServers });

    localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, localStream);
    });

    this.peerConnection.ontrack = event => {
      if (event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(this.remoteStream);
        logger.info("WebRTCManager: remote stream received");
      }
    };

    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.sendSignalingMessage({ type: "ice-candidate", candidate: event.candidate });
      }
    };

    this.dataChannel = this.peerConnection.createDataChannel("sync", { ordered: true });

    this.dataChannel.onopen = () => logger.info("WebRTCManager: data channel opened");
    this.dataChannel.onmessage = event => {
      try {
        const message = JSON.parse(String(event.data));
        this.onDataMessage?.(message);
      } catch (error) {
        logger.error("WebRTCManager: failed to parse data channel message", { error });
      }
    };

    this.peerConnection.ondatachannel = event => {
      const channel = event.channel;
      channel.onmessage = e => {
        try {
          const message = JSON.parse(String(e.data));
          this.onDataMessage?.(message);
        } catch (error) {
          logger.error("WebRTCManager: failed to parse incoming data", { error });
        }
      };
    };

    if (this.config.signalingUrl) {
      await this.connectSignaling();
    }

    logger.info("WebRTCManager: initialized");
  }

  private async connectSignaling(): Promise<void> {
    if (!this.config.signalingUrl) return;

    await new Promise<void>((resolve, reject) => {
      this.signaling = new WebSocket(this.config.signalingUrl!);

      this.signaling.onopen = () => {
        logger.info("WebRTCManager: signaling connected");
        this.sendSignalingMessage({ type: "join", roomId: this.config.roomId });
        resolve();
      };

      this.signaling.onmessage = async event => {
        try {
          const message = JSON.parse(String(event.data));
          await this.handleSignalingMessage(message);
        } catch (error) {
          logger.error("WebRTCManager: failed to handle signaling message", { error });
        }
      };

      this.signaling.onerror = error => {
        logger.error("WebRTCManager: signaling error", { error });
        reject(error);
      };

      this.signaling.onclose = () => {
        logger.info("WebRTCManager: signaling disconnected");
      };
    });
  }

  private sendSignalingMessage(message: unknown): void {
    if (this.signaling?.readyState === WebSocket.OPEN) {
      this.signaling.send(JSON.stringify(message));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peerConnection) return;

    switch (message?.type) {
      case "offer": {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.sendSignalingMessage({ type: "answer", answer });
        break;
      }
      case "answer":
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        break;
      case "ice-candidate":
        if (message.candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
        break;
      case "peer-joined":
        await this.createOffer();
        break;
      default:
        break;
    }
  }

  async createOffer(): Promise<void> {
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.sendSignalingMessage({ type: "offer", offer });
    logger.info("WebRTCManager: offer created and sent");
  }

  sendSyncMessage(type: string, data: unknown): void {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }

  sendRecordingSync(action: "start" | "stop" | "pause" | "resume"): void {
    this.sendSyncMessage("recording-sync", { action });
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  disconnect(): void {
    try {
      this.dataChannel?.close();
    } catch {
      // ignore
    }
    try {
      this.peerConnection?.close();
    } catch {
      // ignore
    }
    try {
      this.signaling?.close();
    } catch {
      // ignore
    }

    this.peerConnection = null;
    this.dataChannel = null;
    this.signaling = null;
    this.remoteStream = null;

    logger.info("WebRTCManager: disconnected");
  }
}
