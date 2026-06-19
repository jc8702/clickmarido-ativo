"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const notifications_listener_1 = require("./notifications.listener");
const notification_queue_1 = require("./queue/notification.queue");
const twilio_sms_provider_1 = require("./providers/twilio-sms.provider");
const twilio_whatsapp_provider_1 = require("./providers/twilio-whatsapp.provider");
const resend_email_provider_1 = require("./providers/resend-email.provider");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        providers: [
            notifications_service_1.NotificationsService,
            notifications_listener_1.NotificationsListener,
            notification_queue_1.NotificationQueue,
            twilio_sms_provider_1.TwilioSmsProvider,
            twilio_whatsapp_provider_1.TwilioWhatsAppProvider,
            resend_email_provider_1.ResendEmailProvider,
        ],
        exports: [notifications_service_1.NotificationsService, notification_queue_1.NotificationQueue],
    })
], NotificationsModule);
