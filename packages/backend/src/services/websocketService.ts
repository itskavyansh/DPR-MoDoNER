import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { UploadProgress } from '../types/upload.js';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join-upload-room', (data: { userId: string, fileId?: string }) => {
        const { userId, fileId } = data;
        this.connectedClients.set(socket.id, userId);
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Join file-specific room if provided
        if (fileId) {
          socket.join(`file:${fileId}`);
        }
        
        socket.emit('joined-upload-room', { userId, fileId });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Send upload progress to specific file room
  emitUploadProgress(fileId: string, progress: UploadProgress): void {
    this.io.to(`file:${fileId}`).emit('upload-progress', progress);
  }

  // Send upload progress to user room
  emitUserUploadProgress(userId: string, progress: UploadProgress): void {
    this.io.to(`user:${userId}`).emit('upload-progress', progress);
  }

  // Send batch upload progress
  emitBatchProgress(userId: string, batchId: string, progress: {
    batchId: string;
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    currentFile?: UploadProgress;
  }): void {
    this.io.to(`user:${userId}`).emit('batch-progress', progress);
  }

  // Send upload completion notification
  emitUploadComplete(fileId: string, result: { success: boolean; fileId: string; message?: string }): void {
    this.io.to(`file:${fileId}`).emit('upload-complete', result);
  }

  // Send upload error notification
  emitUploadError(fileId: string, error: { fileId: string; message: string; code?: string }): void {
    this.io.to(`file:${fileId}`).emit('upload-error', error);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedClients.values()).includes(userId);
  }
}