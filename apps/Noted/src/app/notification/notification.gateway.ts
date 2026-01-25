import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PhotoConversionFailedEvent, PhotoConvertedEvent, PhotoEvent } from "../shared/events/photo-event.types";
import { NotificationEvent } from "@noted/types";


@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }


  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @OnEvent(PhotoEvent.PHOTO_CONVERTED)
  handlePhotoEditResult(event: PhotoConvertedEvent) {

    if (event?.socketId) {
      this.logger.log(`Sending result for user ${event.userId} to socket: ${event.socketId}`);

      this.server.to(event.socketId).emit(NotificationEvent.PHOTO_EDIT, event);
    }
  }
    
  @OnEvent(PhotoEvent.PHOTO_CONVERSION_FAILED)
  handlePhotoEditError(event: PhotoConversionFailedEvent) {

    if (event?.socketId) {
      this.logger.log(`Sending error for user ${event.userId} to socket: ${event.socketId}`);

      this.server.to(event.socketId).emit(NotificationEvent.PHOTO_EDIT, event);
    }
  }
}
