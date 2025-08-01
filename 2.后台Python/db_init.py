#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库初始化脚本
用于创建SQLite数据库和初始化表结构
"""

import sqlite3
import os
from datetime import datetime


class DatabaseInitializer:
    """数据库初始化器"""
    
    def __init__(self, db_path: str = "data/database.sqlite"):
        """
        初始化数据库连接
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        self._ensure_data_directory()
    
    def _ensure_data_directory(self):
        """确保数据目录存在"""
        data_dir = os.path.dirname(self.db_path)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            print(f"创建数据目录: {data_dir}")
    
    def create_database(self):
        """创建数据库和所有表"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 创建用户基础信息表
                self._create_users_table(cursor)
                
                # 创建储物箱表
                self._create_boxes_table(cursor)
                
                # 创建袋子表
                self._create_bags_table(cursor)
                
                # 创建物品表
                self._create_items_table(cursor)
                
                # 创建标签表
                self._create_tags_table(cursor)
                
                # 创建物品标签关联表
                self._create_items_tags_table(cursor)
                
                # 提交事务
                conn.commit()
                print(f"数据库创建成功: {self.db_path}")
                
        except sqlite3.Error as e:
            print(f"数据库创建失败: {e}")
            raise
    
    def _create_users_table(self, cursor):
        """创建用户基础信息表"""
        sql = """
        CREATE TABLE IF NOT EXISTS users_summary (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            openid VARCHAR(64) NOT NULL UNIQUE,
            nickname VARCHAR(100) DEFAULT '',
            status INTEGER DEFAULT 1,
            item_limit INTEGER DEFAULT 30,
            ads_watched_count INTEGER DEFAULT 0,
            last_ad_watched_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(sql)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_openid ON users_summary(openid)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_status ON users_summary(status)")
        
        print("用户基础信息表创建成功")
    
    def _create_boxes_table(self, cursor):
        """创建储物箱表"""
        sql = """
        CREATE TABLE IF NOT EXISTS boxes_summary (
            box_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sort_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT DEFAULT '',
            color VARCHAR(20) DEFAULT '#1296db',
            location VARCHAR(200) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users_summary(user_id)
        )
        """
        cursor.execute(sql)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_boxes_user_id ON boxes_summary(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_boxes_sort_id ON boxes_summary(user_id, sort_id)")
        
        print("储物箱表创建成功")
    
    def _create_bags_table(self, cursor):
        """创建袋子表"""
        sql = """
        CREATE TABLE IF NOT EXISTS bags_summary (
            bag_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            box_id INTEGER NOT NULL,
            sort_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            color VARCHAR(20) DEFAULT '#1296db',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users_summary(user_id),
            FOREIGN KEY (box_id) REFERENCES boxes_summary(box_id)
        )
        """
        cursor.execute(sql)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bags_user_id ON bags_summary(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bags_box_id ON bags_summary(box_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bags_sort_id ON bags_summary(box_id, sort_id)")
        
        print("袋子表创建成功")
    
    def _create_items_table(self, cursor):
        """创建物品表"""
        sql = """
        CREATE TABLE IF NOT EXISTS items_detail (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            box_id INTEGER NOT NULL,
            bag_id INTEGER DEFAULT NULL,
            sort_id INTEGER NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT DEFAULT '',
            category VARCHAR(100) DEFAULT '',
            image_filename VARCHAR(255) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users_summary(user_id),
            FOREIGN KEY (box_id) REFERENCES boxes_summary(box_id),
            FOREIGN KEY (bag_id) REFERENCES bags_summary(bag_id)
        )
        """
        cursor.execute(sql)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_user_id ON items_detail(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_box_id ON items_detail(box_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_bag_id ON items_detail(bag_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_sort_id ON items_detail(box_id, sort_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_category ON items_detail(category)")
        
        print("物品表创建成功")
    
    def _create_tags_table(self, cursor):
        """创建标签表"""
        sql = """
        CREATE TABLE IF NOT EXISTS tags (
            tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL UNIQUE
        )
        """
        cursor.execute(sql)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)")
        
        print("标签表创建成功")
    
    def _create_items_tags_table(self, cursor):
        """创建物品标签关联表"""
        sql = """
        CREATE TABLE IF NOT EXISTS items_tags (
            item_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (item_id, tag_id),
            FOREIGN KEY (item_id) REFERENCES items_detail(item_id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
        )
        """
        cursor.execute(sql)
        
        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_tags_item_id ON items_tags(item_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_tags_tag_id ON items_tags(tag_id)")
        
        print("物品标签关联表创建成功")

def main():
    """主函数"""
    print("开始初始化数据库...")
    
    # 创建数据库初始化器
    db_init = DatabaseInitializer()
    
    # 创建数据库和表
    db_init.create_database()
    
    print("数据库初始化完成！")


if __name__ == "__main__":
    main()