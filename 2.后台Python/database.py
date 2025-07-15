#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库操作工具类
提供数据库连接和常用操作方法
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional, Dict, List, Any
from contextlib import contextmanager


class Database:
    """数据库操作类"""
    
    def __init__(self, db_path: str = "data/database.sqlite"):
        """
        初始化数据库连接
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        self._ensure_database_exists()
    
    def _ensure_database_exists(self):
        """确保数据库文件存在"""
        if not os.path.exists(self.db_path):
            print(f"数据库文件不存在，请先运行 database_init.py 初始化数据库")
            raise FileNotFoundError(f"数据库文件不存在: {self.db_path}")
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # 使查询结果可以像字典一样访问
            yield conn
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, sql: str, params: tuple = ()) -> List[Dict]:
        """
        执行查询语句
        
        Args:
            sql: SQL查询语句
            params: 查询参数
            
        Returns:
            查询结果列表
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def execute_update(self, sql: str, params: tuple = ()) -> int:
        """
        执行更新语句（INSERT, UPDATE, DELETE）
        
        Args:
            sql: SQL更新语句
            params: 更新参数
            
        Returns:
            影响的行数
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return cursor.rowcount
    
    def execute_insert(self, sql: str, params: tuple = ()) -> int:
        """
        执行插入语句并返回新插入记录的ID
        
        Args:
            sql: SQL插入语句
            params: 插入参数
            
        Returns:
            新插入记录的ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return cursor.lastrowid


class UserService:
    """用户服务类"""
    
    def __init__(self, db: Database):
        """
        初始化用户服务
        
        Args:
            db: 数据库操作实例
        """
        self.db = db
    
    def create_user(self, openid: str, nickname: str = '', **kwargs) -> int:
        """
        创建新用户
        
        Args:
            openid: 微信openid
            nickname: 用户昵称
            **kwargs: 其他用户信息字段
            
        Returns:
            新用户的ID
        """
        # 检查用户是否已存在
        existing_user = self.get_user_by_openid(openid)
        if existing_user:
            raise ValueError(f"用户已存在: {openid}")
        
        # 准备插入数据
        fields = ['openid', 'nickname']
        values = [openid, nickname]
        placeholders = ['?', '?']
        
        # 添加其他字段
        allowed_fields = [
            'avatar_url', 'phone', 'email', 'gender', 'city', 
            'province', 'country', 'language'
        ]
        
        for field in allowed_fields:
            if field in kwargs:
                fields.append(field)
                values.append(kwargs[field])
                placeholders.append('?')
        
        # 添加创建时间和更新时间
        fields.extend(['created_at', 'updated_at'])
        current_time = datetime.now().isoformat()
        values.extend([current_time, current_time])
        placeholders.extend(['?', '?'])
        
        sql = f"""
        INSERT INTO users_summary ({', '.join(fields)})
        VALUES ({', '.join(placeholders)})
        """
        
        return self.db.execute_insert(sql, tuple(values))
    
    def get_user_by_openid(self, openid: str) -> Optional[Dict]:
        """
        根据openid获取用户信息
        
        Args:
            openid: 微信openid
            
        Returns:
            用户信息字典，如果不存在返回None
        """
        sql = "SELECT * FROM users_summary WHERE openid = ? AND status != 2"
        results = self.db.execute_query(sql, (openid,))
        return results[0] if results else None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """
        根据用户ID获取用户信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            用户信息字典，如果不存在返回None
        """
        sql = "SELECT * FROM users_summary WHERE user_id = ? AND status != 2"
        results = self.db.execute_query(sql, (user_id,))
        return results[0] if results else None
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """
        更新用户信息
        
        Args:
            user_id: 用户ID
            **kwargs: 要更新的字段
            
        Returns:
            是否更新成功
        """
        if not kwargs:
            return False
        
        # 允许更新的字段
        allowed_fields = [
            'nickname', 'avatar_url', 'phone', 'email', 'gender',
            'city', 'province', 'country', 'language', 'status'
        ]
        
        # 过滤允许的字段
        update_fields = []
        update_values = []
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        if not update_fields:
            return False
        
        # 添加更新时间
        update_fields.append("updated_at = ?")
        update_values.append(datetime.now().isoformat())
        update_values.append(user_id)
        
        sql = f"""
        UPDATE users_summary 
        SET {', '.join(update_fields)}
        WHERE user_id = ?
        """
        
        affected_rows = self.db.execute_update(sql, tuple(update_values))
        return affected_rows > 0
    
    def update_last_login(self, user_id: int) -> bool:
        """
        更新用户最后登录时间
        
        Args:
            user_id: 用户ID
            
        Returns:
            是否更新成功
        """
        sql = """
        UPDATE users_summary 
        SET last_login_at = ?, updated_at = ?
        WHERE user_id = ?
        """
        current_time = datetime.now().isoformat()
        affected_rows = self.db.execute_update(sql, (current_time, current_time, user_id))
        return affected_rows > 0
    
    def delete_user(self, user_id: int) -> bool:
        """
        软删除用户（将状态设置为已删除）
        
        Args:
            user_id: 用户ID
            
        Returns:
            是否删除成功
        """
        sql = """
        UPDATE users_summary 
        SET status = 2, updated_at = ?
        WHERE user_id = ?
        """
        current_time = datetime.now().isoformat()
        affected_rows = self.db.execute_update(sql, (current_time, user_id))
        return affected_rows > 0
    
    def get_user_stats(self, user_id: int) -> Dict:
        """
        获取用户统计信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            用户统计信息
        """
        # 获取物品总数
        item_count_sql = "SELECT COUNT(*) as count FROM items_detail WHERE user_id = ? AND status = 1"
        item_count = self.db.execute_query(item_count_sql, (user_id,))[0]['count']
        
        # 获取分类数量
        category_count_sql = """
        SELECT COUNT(DISTINCT category) as count 
        FROM items_detail 
        WHERE user_id = ? AND status = 1 AND category IS NOT NULL AND category != ''
        """
        category_count = self.db.execute_query(category_count_sql, (user_id,))[0]['count']
        
        # 获取收藏数量 (暂时返回0，因为新结构中没有收藏字段)
        favorite_count = 0
        
        return {
            'item_count': item_count,
            'category_count': category_count,
            'favorite_count': favorite_count
        }
    
    def login_or_register(self, openid: str, nickname: str = '', **kwargs) -> Dict:
        """
        用户登录或注册（如果用户不存在则自动注册）
        
        Args:
            openid: 微信openid
            nickname: 用户昵称
            **kwargs: 其他用户信息
            
        Returns:
            用户信息
        """
        # 尝试获取现有用户
        user = self.get_user_by_openid(openid)
        
        if user:
            # 用户存在，更新最后登录时间
            self.update_last_login(user['user_id'])
            # 如果提供了新的昵称或其他信息，进行更新
            if nickname and nickname != user['nickname']:
                kwargs['nickname'] = nickname
            if kwargs:
                self.update_user(user['user_id'], **kwargs)
                # 重新获取更新后的用户信息
                user = self.get_user_by_id(user['user_id'])
        else:
            # 用户不存在，创建新用户
            user_id = self.create_user(openid, nickname, **kwargs)
            user = self.get_user_by_id(user_id)
        
        return user


# 创建全局数据库实例
db = Database()
user_service = UserService(db)