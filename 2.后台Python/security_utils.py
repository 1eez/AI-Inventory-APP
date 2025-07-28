#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
安全工具模块
用于输入验证和SQL注入防护

@Author: lordli
@Date: 2025-01-20
@Version: 1.0
"""

import re
from typing import Optional
from fastapi import HTTPException

class SecurityValidator:
    """安全验证器"""
    
    # 微信openid的正则表达式模式
    OPENID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{28}$')
    
    # SQL注入关键词黑名单
    SQL_INJECTION_KEYWORDS = [
        'union', 'select', 'insert', 'update', 'delete', 'drop', 'create',
        'alter', 'exec', 'execute', 'script', 'declare', 'cast', 'convert',
        'sleep', 'waitfor', 'delay', 'benchmark', 'load_file', 'into',
        'outfile', 'dumpfile', 'information_schema', 'mysql', 'sys',
        'performance_schema', 'pg_', 'sqlite_', 'master', 'msdb',
        'tempdb', 'model', '--', '/*', '*/', ';', 'xp_', 'sp_'
    ]
    
    @classmethod
    def validate_openid(cls, openid: str) -> str:
        """
        验证微信openid的格式和安全性
        
        Args:
            openid: 待验证的openid
            
        Returns:
            str: 验证通过的openid
            
        Raises:
            HTTPException: 验证失败时抛出异常
        """
        if not openid:
            raise HTTPException(status_code=400, detail="openid不能为空")
        
        # 检查长度
        if len(openid) != 28:
            raise HTTPException(status_code=400, detail="openid格式不正确")
        
        # 检查格式
        if not cls.OPENID_PATTERN.match(openid):
            raise HTTPException(status_code=400, detail="openid包含非法字符")
        
        # 检查SQL注入
        if cls._contains_sql_injection(openid):
            raise HTTPException(status_code=400, detail="openid包含非法内容")
        
        return openid
    
    @classmethod
    def validate_string_input(cls, input_str: str, field_name: str, max_length: int = 255) -> str:
        """
        验证字符串输入的安全性
        
        Args:
            input_str: 待验证的字符串
            field_name: 字段名称
            max_length: 最大长度
            
        Returns:
            str: 验证通过的字符串
            
        Raises:
            HTTPException: 验证失败时抛出异常
        """
        if not input_str:
            return input_str
        
        # 检查长度
        if len(input_str) > max_length:
            raise HTTPException(status_code=400, detail=f"{field_name}长度不能超过{max_length}个字符")
        
        # 检查SQL注入
        if cls._contains_sql_injection(input_str):
            raise HTTPException(status_code=400, detail=f"{field_name}包含非法内容")
        
        return input_str
    
    @classmethod
    def validate_integer_input(cls, input_int: int, field_name: str, min_value: int = 0, max_value: int = 999999999) -> int:
        """
        验证整数输入的安全性
        
        Args:
            input_int: 待验证的整数
            field_name: 字段名称
            min_value: 最小值
            max_value: 最大值
            
        Returns:
            int: 验证通过的整数
            
        Raises:
            HTTPException: 验证失败时抛出异常
        """
        if input_int < min_value or input_int > max_value:
            raise HTTPException(status_code=400, detail=f"{field_name}必须在{min_value}到{max_value}之间")
        
        return input_int
    
    @classmethod
    def _contains_sql_injection(cls, input_str: str) -> bool:
        """
        检查字符串是否包含SQL注入关键词
        
        Args:
            input_str: 待检查的字符串
            
        Returns:
            bool: 是否包含SQL注入关键词
        """
        # 转换为小写进行检查
        lower_input = input_str.lower()
        
        # 检查SQL注入关键词
        for keyword in cls.SQL_INJECTION_KEYWORDS:
            if keyword in lower_input:
                return True
        
        # 检查特殊字符组合
        dangerous_patterns = [
            r"'\s*union\s*select",
            r"'\s*or\s*1\s*=\s*1",
            r"'\s*or\s*'1'\s*=\s*'1",
            r"'\s*and\s*1\s*=\s*1",
            r"'\s*;\s*drop\s*table",
            r"'\s*;\s*delete\s*from",
            r"\)\s*or\s*\(",
            r"sleep\s*\(",
            r"waitfor\s*delay",
            r"benchmark\s*\(",
            r"md5\s*\(",
            r"--\s*",
            r"/\*.*\*/"
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, lower_input, re.IGNORECASE):
                return True
        
        return False
    
    @classmethod
    def sanitize_openid(cls, openid: str) -> Optional[str]:
        """
        清理和修复可能被污染的openid
        
        Args:
            openid: 待清理的openid
            
        Returns:
            Optional[str]: 清理后的openid，如果无法修复则返回None
        """
        if not openid:
            return None
        
        # 移除所有非字母数字、下划线、连字符的字符
        cleaned = re.sub(r'[^a-zA-Z0-9_-]', '', openid)
        
        # 检查清理后的长度
        if len(cleaned) != 28:
            return None
        
        # 再次验证格式
        if not cls.OPENID_PATTERN.match(cleaned):
            return None
        
        return cleaned