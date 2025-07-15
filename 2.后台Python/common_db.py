#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
公共数据库管理模块
@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""
import sqlite3
import os
from typing import Any

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path: str = "data/database.sqlite"):
        """
        初始化数据库管理器
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        self._ensure_database_exists()
    
    def _ensure_database_exists(self):
        """确保数据库文件存在"""
        if not os.path.exists(self.db_path):
            # 如果数据库不存在，创建数据库
            from db_init import DatabaseInitializer
            db_init = DatabaseInitializer(self.db_path)
            db_init.create_database()
    
    def get_connection(self):
        """获取数据库连接"""
        return sqlite3.connect(self.db_path)
    
    def user_exists(self, openid: str) -> bool:
        """
        检查用户是否存在
        
        Args:
            openid: 微信openid
            
        Returns:
            bool: 用户是否存在
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users_summary WHERE openid = ?", (openid,))
            count = cursor.fetchone()[0]
            return count > 0
    
    def get_user_id_by_openid(self, openid: str) -> int:
        """
        根据openid获取用户ID
        
        Args:
            openid: 微信openid
            
        Returns:
            int: 用户ID
            
        Raises:
            ValueError: 用户不存在时抛出异常
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_id FROM users_summary WHERE openid = ?", (openid,))
            result = cursor.fetchone()
            if not result:
                raise ValueError(f"用户不存在: {openid}")
            return result[0]
    
    def execute_query(self, query: str, params: tuple = None, fetch_one: bool = False) -> Any:
        """
        执行查询语句
        
        Args:
            query: SQL查询语句
            params: 查询参数
            fetch_one: 是否只获取一条记录
            
        Returns:
            查询结果
        """
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if fetch_one:
                return cursor.fetchone()
            else:
                return cursor.fetchall()
    
    def execute_insert(self, query: str, params: tuple) -> int:
        """
        执行插入语句
        
        Args:
            query: SQL插入语句
            params: 插入参数
            
        Returns:
            int: 新插入记录的ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.lastrowid
    
    def execute_update(self, query: str, params: tuple) -> int:
        """
        执行更新语句
        
        Args:
            query: SQL更新语句
            params: 更新参数
            
        Returns:
            int: 受影响的行数
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount