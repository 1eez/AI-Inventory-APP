#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库功能测试脚本
测试用户表和新的三层储物结构（箱子-袋子-物品）
"""

from database import user_service
from storage_service import storage_service, box_service, bag_service, item_service
from datetime import datetime


def test_user_operations():
    """测试用户相关操作"""
    print("=== 开始测试用户操作 ===")
    
    # 测试数据
    test_openid = "test_openid_123456"
    test_nickname = "测试用户"
    
    try:
        # 用户登录或注册
        print("\n1. 测试用户登录或注册...")
        user = user_service.login_or_register(
            openid=test_openid,
            nickname=test_nickname,
            city="深圳",
            province="广东"
        )
        print(f"用户信息: {user['nickname']} (ID: {user['id']})")
        return user['id']
        
    except Exception as e:
        print(f"用户操作测试失败: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_storage_operations(user_id):
    """测试储物结构操作"""
    print("\n=== 开始测试储物结构操作 ===")
    
    try:
        # 1. 创建储物箱
        print("\n1. 测试创建储物箱...")
        box1_id = box_service.create_box(user_id, "卧室储物箱", 1)
        box2_id = box_service.create_box(user_id, "客厅储物箱", 2)
        print(f"创建储物箱成功: 卧室储物箱(ID: {box1_id}), 客厅储物箱(ID: {box2_id})")
        
        # 2. 获取用户所有储物箱
        print("\n2. 测试获取用户储物箱...")
        boxes = box_service.get_user_boxes(user_id)
        for box in boxes:
            print(f"储物箱: {box['name']} (ID: {box['id']}, 排序: {box['sort_id']})")
        
        # 3. 创建袋子
        print("\n3. 测试创建袋子...")
        bag1_id = bag_service.create_bag(box1_id, "衣物袋", 1)
        bag2_id = bag_service.create_bag(box1_id, "配件袋", 2)
        bag3_id = bag_service.create_bag(box2_id, "电子产品袋", 1)
        print(f"创建袋子成功: 衣物袋(ID: {bag1_id}), 配件袋(ID: {bag2_id}), 电子产品袋(ID: {bag3_id})")
        
        # 4. 获取储物箱的袋子
        print("\n4. 测试获取储物箱的袋子...")
        box1_bags = bag_service.get_box_bags(box1_id)
        for bag in box1_bags:
            print(f"卧室储物箱的袋子: {bag['name']} (ID: {bag['id']}, 排序: {bag['sort_id']})")
        
        # 5. 创建物品
        print("\n5. 测试创建物品...")
        item1_id = item_service.create_item(
            bag_id=bag1_id,
            title="白色T恤",
            description="纯棉白色短袖T恤，夏季穿着",
            category="服装",
            tags="夏装,休闲,白色",
            image_path="images/2024/01/tshirt_001.jpg",
            sort_id=1
        )
        
        item2_id = item_service.create_item(
            bag_id=bag2_id,
            title="皮质手表",
            description="棕色皮质表带手表",
            category="配件",
            tags="手表,皮质,棕色",
            image_path="images/2024/01/watch_001.jpg",
            sort_id=1
        )
        
        item3_id = item_service.create_item(
            bag_id=bag3_id,
            title="iPhone充电器",
            description="苹果原装充电器",
            category="电子产品",
            tags="充电器,苹果,原装",
            image_path="images/2024/01/charger_001.jpg",
            sort_id=1
        )
        
        print(f"创建物品成功: T恤(ID: {item1_id}), 手表(ID: {item2_id}), 充电器(ID: {item3_id})")
        
        # 6. 获取袋子的物品
        print("\n6. 测试获取袋子的物品...")
        bag1_items = item_service.get_bag_items(bag1_id)
        for item in bag1_items:
            print(f"衣物袋的物品: {item['title']} - {item['description']}")
        
        # 7. 测试完整储物结构树
        print("\n7. 测试获取完整储物结构树...")
        storage_tree = storage_service.get_user_storage_tree(user_id)
        for box in storage_tree:
            print(f"储物箱: {box['name']}")
            for bag in box['bags']:
                print(f"  └─ 袋子: {bag['name']}")
                for item in bag['items']:
                    print(f"      └─ 物品: {item['title']} ({item['category']})")
        
        # 8. 测试搜索功能
        print("\n8. 测试搜索功能...")
        
        # 按分类搜索
        clothing_items = item_service.search_items_by_category(user_id, "服装")
        print(f"服装类物品: {len(clothing_items)}个")
        for item in clothing_items:
            print(f"  - {item['title']} (在{item['box_name']}-{item['bag_name']})")
        
        # 按标签搜索
        leather_items = item_service.search_items_by_tags(user_id, "皮质")
        print(f"皮质标签物品: {len(leather_items)}个")
        for item in leather_items:
            print(f"  - {item['title']} (在{item['box_name']}-{item['bag_name']})")
        
        # 按标题搜索
        iphone_items = item_service.search_items_by_title(user_id, "iPhone")
        print(f"iPhone相关物品: {len(iphone_items)}个")
        for item in iphone_items:
            print(f"  - {item['title']} (在{item['box_name']}-{item['bag_name']})")
        
        # 9. 测试统计信息
        print("\n9. 测试获取用户统计信息...")
        stats = storage_service.get_user_stats(user_id)
        print(f"用户储物统计: {stats}")
        
        # 10. 测试更新操作
        print("\n10. 测试更新操作...")
        
        # 更新储物箱名称
        box_update_success = box_service.update_box(box1_id, name="主卧储物箱")
        if box_update_success:
            updated_box = box_service.get_box_by_id(box1_id)
            print(f"储物箱名称更新成功: {updated_box['name']}")
        
        # 更新物品信息
        item_update_success = item_service.update_item(
            item1_id,
            title="白色纯棉T恤",
            tags="夏装,休闲,白色,纯棉"
        )
        if item_update_success:
            updated_item = item_service.get_item_by_id(item1_id)
            print(f"物品信息更新成功: {updated_item['title']} - 标签: {updated_item['tags']}")
        
        print("\n=== 储物结构操作测试完成 ===")
        
    except Exception as e:
        print(f"储物结构操作测试失败: {e}")
        import traceback
        traceback.print_exc()


def test_delete_operations(user_id):
    """测试删除操作"""
    print("\n=== 开始测试删除操作 ===")
    
    try:
        # 创建测试数据
        test_box_id = box_service.create_box(user_id, "测试删除箱", 99)
        test_bag_id = bag_service.create_bag(test_box_id, "测试删除袋", 99)
        test_item_id = item_service.create_item(
            bag_id=test_bag_id,
            title="测试删除物品",
            description="用于测试删除功能的物品",
            sort_id=99
        )
        
        print(f"创建测试数据: 箱子(ID: {test_box_id}), 袋子(ID: {test_bag_id}), 物品(ID: {test_item_id})")
        
        # 测试删除物品
        item_delete_success = item_service.delete_item(test_item_id)
        if item_delete_success:
            print("物品删除成功")
            # 验证物品已删除
            deleted_item = item_service.get_item_by_id(test_item_id)
            if not deleted_item:
                print("确认物品已被删除")
        
        # 测试删除袋子（级联删除）
        bag_delete_success = bag_service.delete_bag(test_bag_id)
        if bag_delete_success:
            print("袋子删除成功（级联删除）")
        
        # 测试删除储物箱（级联删除）
        box_delete_success = box_service.delete_box(test_box_id)
        if box_delete_success:
            print("储物箱删除成功（级联删除）")
        
        print("\n=== 删除操作测试完成 ===")
        
    except Exception as e:
        print(f"删除操作测试失败: {e}")
        import traceback
        traceback.print_exc()


def main():
    """主函数"""
    print("开始数据库功能测试...")
    
    # 测试用户操作
    user_id = test_user_operations()
    
    if user_id:
        # 测试储物结构操作
        test_storage_operations(user_id)
        
        # 测试删除操作
        test_delete_operations(user_id)
    
    print("\n数据库功能测试完成！")


if __name__ == "__main__":
    main()