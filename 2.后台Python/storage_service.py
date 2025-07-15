#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
储物管理服务类
提供箱子、袋子、物品的CRUD操作
"""

from datetime import datetime
from typing import Optional, Dict, List, Any
from database import Database


class BoxService:
    """储物箱服务类"""
    
    def __init__(self, db: Database):
        """
        初始化储物箱服务
        
        Args:
            db: 数据库操作实例
        """
        self.db = db
    
    def create_box(self, user_id: int, name: str, sort_id: int = None) -> int:
        """
        创建新储物箱
        
        Args:
            user_id: 用户ID
            name: 储物箱名称
            sort_id: 排序ID，如果不提供则自动生成
            
        Returns:
            新储物箱的ID
        """
        if sort_id is None:
            # 自动生成排序ID（取当前用户最大排序ID + 1）
            max_sort_sql = "SELECT COALESCE(MAX(sort_id), 0) as max_sort FROM boxes_summary WHERE user_id = ?"
            result = self.db.execute_query(max_sort_sql, (user_id,))
            sort_id = result[0]['max_sort'] + 1
        
        sql = """
        INSERT INTO boxes_summary (user_id, sort_id, name, created_at)
        VALUES (?, ?, ?, ?)
        """
        current_time = datetime.now().isoformat()
        return self.db.execute_insert(sql, (user_id, sort_id, name, current_time))
    
    def get_user_boxes(self, user_id: int) -> List[Dict]:
        """
        获取用户的所有储物箱
        
        Args:
            user_id: 用户ID
            
        Returns:
            储物箱列表，按排序ID排序
        """
        sql = "SELECT * FROM boxes_summary WHERE user_id = ? ORDER BY sort_id ASC"
        return self.db.execute_query(sql, (user_id,))
    
    def get_box_by_id(self, box_id: int) -> Optional[Dict]:
        """
        根据ID获取储物箱信息
        
        Args:
            box_id: 储物箱ID
            
        Returns:
            储物箱信息字典，如果不存在返回None
        """
        sql = "SELECT * FROM boxes_summary WHERE box_id = ?"
        results = self.db.execute_query(sql, (box_id,))
        return results[0] if results else None
    
    def update_box(self, box_id: int, name: str = None, sort_id: int = None) -> bool:
        """
        更新储物箱信息
        
        Args:
            box_id: 储物箱ID
            name: 新名称
            sort_id: 新排序ID
            
        Returns:
            是否更新成功
        """
        update_fields = []
        update_values = []
        
        if name is not None:
            update_fields.append("name = ?")
            update_values.append(name)
        
        if sort_id is not None:
            update_fields.append("sort_id = ?")
            update_values.append(sort_id)
        
        if not update_fields:
            return False
        
        update_values.append(box_id)
        sql = f"UPDATE boxes_summary SET {', '.join(update_fields)} WHERE box_id = ?"
        
        affected_rows = self.db.execute_update(sql, tuple(update_values))
        return affected_rows > 0
    
    def delete_box(self, box_id: int) -> bool:
        """
        删除储物箱（级联删除所有袋子和物品）
        
        Args:
            box_id: 储物箱ID
            
        Returns:
            是否删除成功
        """
        sql = "DELETE FROM boxes_summary WHERE box_id = ?"
        affected_rows = self.db.execute_update(sql, (box_id,))
        return affected_rows > 0


class BagService:
    """袋子服务类"""
    
    def __init__(self, db: Database):
        """
        初始化袋子服务
        
        Args:
            db: 数据库操作实例
        """
        self.db = db
    
    def create_bag(self, box_id: int, name: str, sort_id: int = None) -> int:
        """
        创建新袋子
        
        Args:
            box_id: 所属储物箱ID
            name: 袋子名称
            sort_id: 排序ID，如果不提供则自动生成
            
        Returns:
            新袋子的ID
        """
        if sort_id is None:
            # 自动生成排序ID（取当前箱子最大排序ID + 1）
            max_sort_sql = "SELECT COALESCE(MAX(sort_id), 0) as max_sort FROM bags_summary WHERE box_id = ?"
            result = self.db.execute_query(max_sort_sql, (box_id,))
            sort_id = result[0]['max_sort'] + 1
        
        sql = """
        INSERT INTO bags_summary (box_id, sort_id, name, created_at)
        VALUES (?, ?, ?, ?)
        """
        current_time = datetime.now().isoformat()
        return self.db.execute_insert(sql, (box_id, sort_id, name, current_time))
    
    def get_box_bags(self, box_id: int) -> List[Dict]:
        """
        获取储物箱的所有袋子
        
        Args:
            box_id: 储物箱ID
            
        Returns:
            袋子列表，按排序ID排序
        """
        sql = "SELECT * FROM bags_summary WHERE box_id = ? ORDER BY sort_id ASC"
        return self.db.execute_query(sql, (box_id,))
    
    def get_bag_by_id(self, bag_id: int) -> Optional[Dict]:
        """
        根据ID获取袋子信息
        
        Args:
            bag_id: 袋子ID
            
        Returns:
            袋子信息字典，如果不存在返回None
        """
        sql = "SELECT * FROM bags_summary WHERE bag_id = ?"
        results = self.db.execute_query(sql, (bag_id,))
        return results[0] if results else None
    
    def update_bag(self, bag_id: int, name: str = None, sort_id: int = None) -> bool:
        """
        更新袋子信息
        
        Args:
            bag_id: 袋子ID
            name: 新名称
            sort_id: 新排序ID
            
        Returns:
            是否更新成功
        """
        update_fields = []
        update_values = []
        
        if name is not None:
            update_fields.append("name = ?")
            update_values.append(name)
        
        if sort_id is not None:
            update_fields.append("sort_id = ?")
            update_values.append(sort_id)
        
        if not update_fields:
            return False
        
        update_values.append(bag_id)
        sql = f"UPDATE bags_summary SET {', '.join(update_fields)} WHERE bag_id = ?"
        
        affected_rows = self.db.execute_update(sql, tuple(update_values))
        return affected_rows > 0
    
    def delete_bag(self, bag_id: int) -> bool:
        """
        删除袋子（级联删除所有物品）
        
        Args:
            bag_id: 袋子ID
            
        Returns:
            是否删除成功
        """
        sql = "DELETE FROM bags_summary WHERE bag_id = ?"
        affected_rows = self.db.execute_update(sql, (bag_id,))
        return affected_rows > 0


class ItemService:
    """物品服务类"""
    
    def __init__(self, db: Database):
        """
        初始化物品服务
        
        Args:
            db: 数据库操作实例
        """
        self.db = db
    
    def create_item(self, bag_id: int, title: str, description: str = '', 
                   category: str = '', tags: str = '', image_path: str = '', 
                   sort_id: int = None) -> int:
        """
        创建新物品
        
        Args:
            bag_id: 所属袋子ID
            title: 物品标题
            description: 物品描述
            category: 分类
            tags: 标签（逗号分隔）
            image_path: 图片相对路径
            sort_id: 排序ID，如果不提供则自动生成
            
        Returns:
            新物品的ID
        """
        if sort_id is None:
            # 自动生成排序ID（取当前袋子最大排序ID + 1）
            max_sort_sql = "SELECT COALESCE(MAX(sort_id), 0) as max_sort FROM items_detail WHERE bag_id = ?"
            result = self.db.execute_query(max_sort_sql, (bag_id,))
            sort_id = result[0]['max_sort'] + 1
        
        sql = """
        INSERT INTO items_detail (bag_id, sort_id, title, description, category, tags, image_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        current_time = datetime.now().isoformat()
        return self.db.execute_insert(sql, (bag_id, sort_id, title, description, category, tags, image_path, current_time))
    
    def get_bag_items(self, bag_id: int) -> List[Dict]:
        """
        获取袋子的所有物品
        
        Args:
            bag_id: 袋子ID
            
        Returns:
            物品列表，按排序ID排序
        """
        sql = "SELECT * FROM items_detail WHERE bag_id = ? ORDER BY sort_id ASC"
        return self.db.execute_query(sql, (bag_id,))
    
    def get_item_by_id(self, item_id: int) -> Optional[Dict]:
        """
        根据ID获取物品信息
        
        Args:
            item_id: 物品ID
            
        Returns:
            物品信息字典，如果不存在返回None
        """
        sql = "SELECT * FROM items_detail WHERE item_id = ?"
        results = self.db.execute_query(sql, (item_id,))
        return results[0] if results else None
    
    def update_item(self, item_id: int, **kwargs) -> bool:
        """
        更新物品信息
        
        Args:
            item_id: 物品ID
            **kwargs: 要更新的字段
            
        Returns:
            是否更新成功
        """
        allowed_fields = ['title', 'description', 'category', 'tags', 'image_path', 'sort_id']
        
        update_fields = []
        update_values = []
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        if not update_fields:
            return False
        
        update_values.append(item_id)
        sql = f"UPDATE items_detail SET {', '.join(update_fields)} WHERE item_id = ?"
        
        affected_rows = self.db.execute_update(sql, tuple(update_values))
        return affected_rows > 0
    
    def delete_item(self, item_id: int) -> bool:
        """
        删除物品
        
        Args:
            item_id: 物品ID
            
        Returns:
            是否删除成功
        """
        sql = "DELETE FROM items_detail WHERE item_id = ?"
        affected_rows = self.db.execute_update(sql, (item_id,))
        return affected_rows > 0
    
    def search_items_by_category(self, user_id: int, category: str) -> List[Dict]:
        """
        按分类搜索用户的物品
        
        Args:
            user_id: 用户ID
            category: 分类名称
            
        Returns:
            物品列表
        """
        sql = """
        SELECT i.*, b.name as bag_name, bo.name as box_name
        FROM items_detail i
        JOIN bags_summary b ON i.bag_id = b.bag_id
        JOIN boxes_summary bo ON b.box_id = bo.box_id
        WHERE bo.user_id = ? AND i.category LIKE ?
        ORDER BY bo.sort_id, b.sort_id, i.sort_id
        """
        return self.db.execute_query(sql, (user_id, f"%{category}%"))
    
    def search_items_by_tags(self, user_id: int, tag: str) -> List[Dict]:
        """
        按标签搜索用户的物品
        
        Args:
            user_id: 用户ID
            tag: 标签名称
            
        Returns:
            物品列表
        """
        sql = """
        SELECT i.*, b.name as bag_name, bo.name as box_name
        FROM items_detail i
        JOIN bags_summary b ON i.bag_id = b.bag_id
        JOIN boxes_summary bo ON b.box_id = bo.box_id
        WHERE bo.user_id = ? AND i.tags LIKE ?
        ORDER BY bo.sort_id, b.sort_id, i.sort_id
        """
        return self.db.execute_query(sql, (user_id, f"%{tag}%"))
    
    def search_items_by_title(self, user_id: int, keyword: str) -> List[Dict]:
        """
        按标题关键词搜索用户的物品
        
        Args:
            user_id: 用户ID
            keyword: 关键词
            
        Returns:
            物品列表
        """
        sql = """
        SELECT i.*, b.name as bag_name, bo.name as box_name
        FROM items_detail i
        JOIN bags_summary b ON i.bag_id = b.bag_id
        JOIN boxes_summary bo ON b.box_id = bo.box_id
        WHERE bo.user_id = ? AND (i.title LIKE ? OR i.description LIKE ?)
        ORDER BY bo.sort_id, b.sort_id, i.sort_id
        """
        keyword_pattern = f"%{keyword}%"
        return self.db.execute_query(sql, (user_id, keyword_pattern, keyword_pattern))


class StorageService:
    """综合储物管理服务类"""
    
    def __init__(self, db: Database):
        """
        初始化储物管理服务
        
        Args:
            db: 数据库操作实例
        """
        self.db = db
        self.box_service = BoxService(db)
        self.bag_service = BagService(db)
        self.item_service = ItemService(db)
    
    def get_user_storage_tree(self, user_id: int) -> List[Dict]:
        """
        获取用户完整的储物结构树
        
        Args:
            user_id: 用户ID
            
        Returns:
            包含箱子、袋子、物品的完整树形结构
        """
        # 获取所有箱子
        boxes = self.box_service.get_user_boxes(user_id)
        
        for box in boxes:
            # 获取每个箱子的袋子
            bags = self.bag_service.get_box_bags(box['box_id'])
            
            for bag in bags:
                # 获取每个袋子的物品
                items = self.item_service.get_bag_items(bag['bag_id'])
                bag['items'] = items
            
            box['bags'] = bags
        
        return boxes
    
    def get_user_stats(self, user_id: int) -> Dict:
        """
        获取用户储物统计信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            统计信息字典
        """
        # 箱子数量
        box_count_sql = "SELECT COUNT(*) as count FROM boxes_summary WHERE user_id = ?"
        box_count = self.db.execute_query(box_count_sql, (user_id,))[0]['count']
        
        # 袋子数量
        bag_count_sql = """
        SELECT COUNT(*) as count 
        FROM bags_summary b 
        JOIN boxes_summary bo ON b.box_id = bo.box_id 
        WHERE bo.user_id = ?
        """
        bag_count = self.db.execute_query(bag_count_sql, (user_id,))[0]['count']
        
        # 物品数量
        item_count_sql = """
        SELECT COUNT(*) as count 
        FROM items_detail i 
        JOIN bags_summary b ON i.bag_id = b.bag_id 
        JOIN boxes_summary bo ON b.box_id = bo.box_id 
        WHERE bo.user_id = ?
        """
        item_count = self.db.execute_query(item_count_sql, (user_id,))[0]['count']
        
        return {
            'box_count': box_count,
            'bag_count': bag_count,
            'item_count': item_count
        }


# 创建全局服务实例
from database import db
storage_service = StorageService(db)
box_service = storage_service.box_service
bag_service = storage_service.bag_service
item_service = storage_service.item_service