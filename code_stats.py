import os
from pathlib import Path

def count_lines_and_files(directory, extensions, exclude_dirs):
    """
    统计指定目录下特定扩展名文件的行数和文件数量
    :param directory: 要统计的目录
    :param extensions: 要统计的文件扩展名列表
    :param exclude_dirs: 要排除的目录名列表
    :return: (文件数量, 总行数)
    """
    file_count = 0
    line_count = 0
    
    for root, dirs, files in os.walk(directory):
        # 排除不需要的目录
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        file_count += 1
                        line_count += len(lines)
                except (UnicodeDecodeError, PermissionError, IsADirectoryError):
                    # 忽略无法读取的文件
                    continue
    
    return file_count, line_count

def main():
    # 获取当前脚本所在目录作为项目根目录
    project_dir = Path(__file__).parent.resolve()

    print(f"正在统计项目目录: {project_dir}\n")

    # 定义要统计的文件扩展名和要排除的目录
    config = {
        "前端小程序": {
            "path": project_dir / "1.前端小程序",
            "extensions": ['.wxml', '.js', '.wxss', '.css', '.scss', '.html', '.json'],
            "exclude_dirs": ['node_modules', 'dist', 'build']
        },
        "后台服务": {
            "path": project_dir / "2.后台Python",
            "extensions": ['.py', '.sql', '.md', '.json', '.ini'],
            "exclude_dirs": ['__pycache__', 'venv', 'env']
        },
        "接口测试": {
            "path": project_dir / "3.接口测试脚本",
            "extensions": ['.bru', '.sql', '.md', '.json', '.ini'],
            "exclude_dirs": ['__pycache__', 'venv', 'env']
        }
    }

    print("\n代码统计结果:")
    print("-" * 55)
    print("{:<20} {:>12} {:>12}".format("模块", "文件数量", "代码行数"))
    print("-" * 55)

    total_files = 0
    total_lines = 0

    for module, cfg in config.items():
        if not cfg['path'].exists():
            print(f"{module:<20} {'目录不存在':>12} {'跳过统计':>12}")
            continue
            
        files, lines = count_lines_and_files(
            cfg['path'], 
            cfg['extensions'], 
            cfg['exclude_dirs']
        )
        
        print("{:<20} {:>12} {:>12}".format(module, f"{files:,}", f"{lines:,}"))
        total_files += files
        total_lines += lines
    
    print("-" * 55)
    print("{:<20} {:>12} {:>12}".format("总计", total_files, f"{total_lines:,}"))
    print("-" * 55)

if __name__ == "__main__":
    main()