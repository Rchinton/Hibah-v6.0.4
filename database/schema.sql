CREATE DATABASE IF NOT EXISTS hibah_peternakan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hibah_peternakan;

CREATE TABLE IF NOT EXISTS db_field (
  id VARCHAR(80) NOT NULL,
  field_label VARCHAR(1000) NOT NULL,
  field_key VARCHAR(120) NOT NULL,
  field_type VARCHAR(32) NOT NULL,
  field_options TEXT NOT NULL,
  field_placeholder VARCHAR(255) NOT NULL DEFAULT '',
  field_description TEXT NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_db_field_key (field_key),
  KEY idx_db_field_order (display_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS db_hibah (
  id VARCHAR(80) NOT NULL,
  no_id VARCHAR(64) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Menunggu',
  created_label VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_db_hibah_no_id (no_id),
  KEY idx_db_hibah_status (status),
  KEY idx_db_hibah_updated_at (updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_metadata (
  meta_key VARCHAR(80) NOT NULL,
  meta_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (meta_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

INSERT IGNORE INTO app_settings (setting_key, setting_value)
VALUES ('announcement', 'Pengumuman-pengumuman.... mohon perhatian...!');

CREATE TABLE IF NOT EXISTS app_sync_changes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  collection_name VARCHAR(40) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  operation VARCHAR(12) NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sync_collection_id (collection_name, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(180) NOT NULL,
  contact_whatsapp VARCHAR(32) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(32) NOT NULL DEFAULT 'Aktif',
  photo MEDIUMTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS db_verification_field (
  id VARCHAR(80) NOT NULL,
  field_label VARCHAR(1000) NOT NULL,
  field_key VARCHAR(120) NOT NULL,
  field_type VARCHAR(32) NOT NULL,
  field_options TEXT NOT NULL,
  field_placeholder VARCHAR(255) NOT NULL DEFAULT '',
  field_description TEXT NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_db_verification_field_key (field_key),
  KEY idx_db_verification_field_order (display_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS db_hibah_verification (
  id VARCHAR(80) NOT NULL,
  hibah_id VARCHAR(80) NOT NULL,
  no_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Terverifikasi',
  hibah_snapshot JSON NOT NULL,
  verification_values JSON NOT NULL,
  verified_by VARCHAR(80) NULL,
  verified_by_name VARCHAR(180) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_verification_per_hibah (hibah_id),
  KEY idx_verification_no_id (no_id),
  KEY idx_verification_updated_at (updated_at),
  CONSTRAINT fk_verification_hibah FOREIGN KEY (hibah_id) REFERENCES db_hibah (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO app_metadata (meta_key, meta_value)
VALUES ('data_initialized', '0'), ('users_initialized', '0'), ('verification_fields_initialized', '1')
ON DUPLICATE KEY UPDATE meta_key = VALUES(meta_key);

INSERT IGNORE INTO db_verification_field (id, field_label, field_key, field_type, field_options, field_description, is_required, display_order, is_active)
VALUES
  ('vf_kesesuaian', 'Kesesuaian data dengan dokumen', 'kesesuaian_data', 'list', 'Sesuai;Tidak sesuai;Perlu perbaikan', 'Bandingkan data pengajuan dengan dokumen pendukung.', 1, 0, 1),
  ('vf_dokumen', 'Kelengkapan dokumen', 'kelengkapan_dokumen', 'checklist', 'KTP;Proposal;Rencana Anggaran Biaya;Surat Pernyataan', 'Pilih seluruh dokumen yang sudah diterima dan diperiksa.', 0, 1, 1),
  ('vf_catatan', 'Catatan verifikator', 'catatan_verifikator', 'paragraph', '', 'Tuliskan temuan atau tindak lanjut yang diperlukan.', 0, 2, 1);