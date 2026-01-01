-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: rfid
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `daily_attendance`
--

DROP TABLE IF EXISTS `daily_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_uid` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `first_enter_time` timestamp NULL DEFAULT NULL,
  `first_enter_room_id` int DEFAULT NULL,
  `last_exit_time` timestamp NULL DEFAULT NULL,
  `last_exit_room_id` int DEFAULT NULL,
  `total_rooms_visited` int DEFAULT '0',
  `total_entries` int DEFAULT '0',
  `total_exits` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_date` (`employee_uid`,`date`),
  KEY `first_enter_room_id` (`first_enter_room_id`),
  KEY `last_exit_room_id` (`last_exit_room_id`),
  CONSTRAINT `daily_attendance_ibfk_1` FOREIGN KEY (`employee_uid`) REFERENCES `employees` (`uid`),
  CONSTRAINT `daily_attendance_ibfk_2` FOREIGN KEY (`first_enter_room_id`) REFERENCES `rooms` (`id`),
  CONSTRAINT `daily_attendance_ibfk_3` FOREIGN KEY (`last_exit_room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_attendance`
--

LOCK TABLES `daily_attendance` WRITE;
/*!40000 ALTER TABLE `daily_attendance` DISABLE KEYS */;
INSERT INTO `daily_attendance` VALUES (1,'05B60DFB','2026-01-01','2026-01-01 13:39:17',1,'2026-01-01 13:39:39',1,1,1,1,'2026-01-01 13:39:16','2026-01-01 13:39:39');
/*!40000 ALTER TABLE `daily_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (20,'05B60DFB','Abit','Yudha Prasetyo');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_logs`
--

DROP TABLE IF EXISTS `room_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_uid` varchar(255) NOT NULL,
  `room_id` int NOT NULL,
  `action` enum('enter','exit') NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `idx_employee_uid` (`employee_uid`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `room_logs_ibfk_1` FOREIGN KEY (`employee_uid`) REFERENCES `employees` (`uid`) ON DELETE CASCADE,
  CONSTRAINT `room_logs_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_logs`
--

LOCK TABLES `room_logs` WRITE;
/*!40000 ALTER TABLE `room_logs` DISABLE KEYS */;
INSERT INTO `room_logs` VALUES (1,'05B60DFB',1,'enter','2026-01-01 13:39:17'),(2,'05B60DFB',1,'exit','2026-01-01 13:39:39');
/*!40000 ALTER TABLE `room_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `max_capacity` int DEFAULT '20',
  `current_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Main Room','Information Room',20,0,'2025-11-06 06:34:22');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-01 20:58:58
