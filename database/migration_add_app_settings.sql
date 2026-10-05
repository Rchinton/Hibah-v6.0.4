CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

INSERT IGNORE INTO app_settings (setting_key, setting_value)
VALUES ('announcement', 'Pengumuman-pengumuman.... mohon perhatian...!');
