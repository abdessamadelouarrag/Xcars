-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `role` ENUM('OWNER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'OWNER',
    `preferredLocale` VARCHAR(191) NOT NULL DEFAULT 'fr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` CHAR(36) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `purpose` ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET') NOT NULL DEFAULT 'EMAIL_VERIFICATION',

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    INDEX `VerificationToken_identifier_purpose_idx`(`identifier`, `purpose`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agency` (
    `id` CHAR(36) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `customDomain` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT',
    `onboardingStep` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agency_slug_key`(`slug`),
    UNIQUE INDEX `Agency_customDomain_key`(`customDomain`),
    INDEX `Agency_ownerId_idx`(`ownerId`),
    INDEX `Agency_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgencyMember` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `role` ENUM('OWNER', 'STAFF') NOT NULL,
    `permissions` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgencyMember_userId_isActive_idx`(`userId`, `isActive`),
    UNIQUE INDEX `AgencyMember_agencyId_userId_key`(`agencyId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgencySettings` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `phone` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `openingHours` JSON NULL,
    `logoUrl` VARCHAR(191) NULL,
    `logoPublicId` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `faviconPublicId` VARCHAR(191) NULL,
    `coverUrl` VARCHAR(191) NULL,
    `coverPublicId` VARCHAR(191) NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'fr',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Africa/Casablanca',
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `seoKeywords` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgencySettings_agencyId_key`(`agencyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThemeConfiguration` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NULL,
    `version` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `preset` ENUM('ELEGANT', 'MINIMAL', 'SPORT', 'LUXURY') NOT NULL DEFAULT 'MINIMAL',
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#0F766E',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#0F172A',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#F59E0B',
    `backgroundColor` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `textColor` VARCHAR(191) NOT NULL DEFAULT '#0F172A',
    `headingFont` VARCHAR(191) NOT NULL DEFAULT 'Manrope',
    `bodyFont` VARCHAR(191) NOT NULL DEFAULT 'Inter',
    `radius` ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL DEFAULT 'MEDIUM',
    `buttonStyle` VARCHAR(191) NOT NULL DEFAULT 'solid',
    `cardStyle` VARCHAR(191) NOT NULL DEFAULT 'elevated',
    `navigationStyle` VARCHAR(191) NOT NULL DEFAULT 'floating',
    `spacingScale` VARCHAR(191) NOT NULL DEFAULT 'comfortable',
    `heroEyebrow` VARCHAR(191) NULL,
    `heroTitle` VARCHAR(191) NULL,
    `heroDescription` TEXT NULL,
    `visibleSections` JSON NOT NULL,
    `sectionOrder` JSON NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ThemeConfiguration_agencyId_status_idx`(`agencyId`, `status`),
    UNIQUE INDEX `ThemeConfiguration_agencyId_version_key`(`agencyId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `licensePlate` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `transmission` ENUM('MANUAL', 'AUTOMATIC') NOT NULL,
    `fuelType` ENUM('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG') NOT NULL,
    `seats` INTEGER NOT NULL,
    `doors` INTEGER NOT NULL,
    `mileage` INTEGER NOT NULL DEFAULT 0,
    `color` VARCHAR(191) NOT NULL,
    `dailyPrice` DECIMAL(10, 2) NOT NULL,
    `weeklyPrice` DECIMAL(10, 2) NULL,
    `deposit` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `description` TEXT NOT NULL,
    `rentalConditions` TEXT NULL,
    `status` ENUM('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'ARCHIVED') NOT NULL DEFAULT 'AVAILABLE',
    `totalQuantity` INTEGER NOT NULL DEFAULT 1,
    `location` VARCHAR(191) NOT NULL,
    `availableFrom` DATETIME(3) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `popularity` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vehicle_agencyId_status_isArchived_idx`(`agencyId`, `status`, `isArchived`),
    INDEX `Vehicle_agencyId_category_idx`(`agencyId`, `category`),
    INDEX `Vehicle_agencyId_dailyPrice_idx`(`agencyId`, `dailyPrice`),
    INDEX `Vehicle_agencyId_createdAt_idx`(`agencyId`, `createdAt`),
    UNIQUE INDEX `Vehicle_agencyId_slug_key`(`agencyId`, `slug`),
    UNIQUE INDEX `Vehicle_agencyId_licensePlate_key`(`agencyId`, `licensePlate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleImage` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NULL,
    `alt` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleImage_agencyId_vehicleId_idx`(`agencyId`, `vehicleId`),
    UNIQUE INDEX `VehicleImage_vehicleId_position_key`(`vehicleId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleFeature` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleFeature_agencyId_idx`(`agencyId`),
    UNIQUE INDEX `VehicleFeature_vehicleId_name_key`(`vehicleId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleAvailabilityBlock` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `reason` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleAvailabilityBlock_agencyId_vehicleId_startsAt_endsAt_idx`(`agencyId`, `vehicleId`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'fr',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Customer_agencyId_phone_idx`(`agencyId`, `phone`),
    UNIQUE INDEX `Customer_agencyId_email_key`(`agencyId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `customerId` CHAR(36) NOT NULL,
    `createdById` CHAR(36) NULL,
    `reference` VARCHAR(191) NOT NULL,
    `status` ENUM('NEW', 'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'NEW',
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `pickupLocation` VARCHAR(191) NOT NULL,
    `returnLocation` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `dailyRate` DECIMAL(10, 2) NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `customerMessage` TEXT NULL,
    `internalNote` TEXT NULL,
    `acceptedTermsAt` DATETIME(3) NOT NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Reservation_reference_key`(`reference`),
    INDEX `Reservation_agencyId_status_startsAt_idx`(`agencyId`, `status`, `startsAt`),
    INDEX `Reservation_agencyId_vehicleId_startsAt_endsAt_idx`(`agencyId`, `vehicleId`, `startsAt`, `endsAt`),
    INDEX `Reservation_agencyId_createdAt_idx`(`agencyId`, `createdAt`),
    UNIQUE INDEX `Reservation_agencyId_idempotencyKey_key`(`agencyId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReservationStatusHistory` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `reservationId` CHAR(36) NOT NULL,
    `changedById` CHAR(36) NULL,
    `fromStatus` ENUM('NEW', 'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED') NULL,
    `toStatus` ENUM('NEW', 'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED') NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReservationStatusHistory_agencyId_reservationId_createdAt_idx`(`agencyId`, `reservationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleStatusHistory` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `changedById` CHAR(36) NULL,
    `fromStatus` ENUM('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'ARCHIVED') NULL,
    `toStatus` ENUM('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'ARCHIVED') NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VehicleStatusHistory_agencyId_vehicleId_createdAt_idx`(`agencyId`, `vehicleId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `href` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Notification_agencyId_userId_readAt_idx`(`agencyId`, `userId`, `readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NULL,
    `actorId` CHAR(36) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_agencyId_createdAt_idx`(`agencyId`, `createdAt`),
    INDEX `AuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgencyInvitation` (
    `id` CHAR(36) NOT NULL,
    `agencyId` CHAR(36) NOT NULL,
    `invitedById` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `permissions` JSON NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgencyInvitation_tokenHash_key`(`tokenHash`),
    INDEX `AgencyInvitation_email_status_idx`(`email`, `status`),
    UNIQUE INDEX `AgencyInvitation_agencyId_email_status_key`(`agencyId`, `email`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agency` ADD CONSTRAINT `Agency_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyMember` ADD CONSTRAINT `AgencyMember_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyMember` ADD CONSTRAINT `AgencyMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencySettings` ADD CONSTRAINT `AgencySettings_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThemeConfiguration` ADD CONSTRAINT `ThemeConfiguration_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThemeConfiguration` ADD CONSTRAINT `ThemeConfiguration_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleImage` ADD CONSTRAINT `VehicleImage_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleImage` ADD CONSTRAINT `VehicleImage_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleFeature` ADD CONSTRAINT `VehicleFeature_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleFeature` ADD CONSTRAINT `VehicleFeature_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleAvailabilityBlock` ADD CONSTRAINT `VehicleAvailabilityBlock_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleAvailabilityBlock` ADD CONSTRAINT `VehicleAvailabilityBlock_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationStatusHistory` ADD CONSTRAINT `ReservationStatusHistory_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationStatusHistory` ADD CONSTRAINT `ReservationStatusHistory_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReservationStatusHistory` ADD CONSTRAINT `ReservationStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleStatusHistory` ADD CONSTRAINT `VehicleStatusHistory_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleStatusHistory` ADD CONSTRAINT `VehicleStatusHistory_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleStatusHistory` ADD CONSTRAINT `VehicleStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyInvitation` ADD CONSTRAINT `AgencyInvitation_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyInvitation` ADD CONSTRAINT `AgencyInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
