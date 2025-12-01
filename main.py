import webview
import json
import os
from datetime import datetime
from dateutil import parser

# --- TKinter 对话框 ---
import tkinter as tk
from tkinter import messagebox
class TKinterDialogs:
    def __init__(self):
        # 定义现代化样式
        self.styles = {
            "bg_color": "#f0f0f0",
            "header_color": "#2196F3",
            "button_color": "#4CAF50",
            "cancel_button_color": "#f44336",
            "text_color": "#333333",
            "border_color": "#cccccc",
            "font_family": ("Microsoft YaHei", 10),
            "header_font": ("Microsoft YaHei", 12, "bold"),
            "title_font": ("Microsoft YaHei", 14, "bold")
        }
        pass
    
    def show_custom_alert(self, message):
        """显示自定义警告框"""
        root = tk.Tk()
        root.withdraw()  # 隐藏主窗口
        try:
            # 使用标准对话框，因为它们已经是现代化的
            messagebox.showinfo("提示", message)
            return {"success": True, "result": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            root.destroy()
    
    def show_custom_confirm(self, message):
        """显示自定义确认框"""
        root = tk.Tk()
        root.withdraw()  # 隐藏主窗口
        root.attributes('-topmost', True)  # 窗口置顶
        try:
            result = messagebox.askyesno("确认", message)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            root.destroy()
    
    def show_custom_prompt(self, message, default_value=""):
        """显示自定义输入框"""
        root = tk.Tk()
        root.title("输入")
        root.geometry("400x200")
        root.configure(bg=self.styles["bg_color"])
        root.attributes('-topmost', True)  # 窗口置顶
        root.resizable(False, False)
        
        # 居中显示窗口
        root.eval('tk::PlaceWindow . center')
        
        result = {"value": None}
        
        def on_confirm():
            result["value"] = entry.get()
            root.quit()
            
        def on_cancel():
            result["value"] = None
            root.quit()
            
        def on_entry_confirm(event):
            on_confirm()
        
        # 创建主框架
        main_frame = tk.Frame(root, bg=self.styles["bg_color"], padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 消息标签
        message_label = tk.Label(
            main_frame,
            text=message,
            font=self.styles["font_family"],
            bg=self.styles["bg_color"],
            fg=self.styles["text_color"]
        )
        message_label.pack(pady=(0, 10))
        
        # 输入框
        entry = tk.Entry(
            main_frame,
            font=self.styles["font_family"],
            bg="white",
            fg=self.styles["text_color"],
            relief=tk.SOLID,
            borderwidth=1
        )
        entry.pack(fill=tk.X, pady=(0, 15))
        entry.insert(0, default_value)
        entry.select_range(0, tk.END)
        entry.focus()
        
        # 绑定回车键确认
        entry.bind('<Return>', on_entry_confirm)
        
        # 按钮框架
        button_frame = tk.Frame(main_frame, bg=self.styles["bg_color"])
        button_frame.pack(fill=tk.X)
        
        # 确定按钮
        confirm_btn = tk.Button(
            button_frame,
            text="确定",
            command=on_confirm,
            bg=self.styles["button_color"],
            fg="white",
            font=self.styles["font_family"],
            relief=tk.FLAT,
            padx=20
        )
        confirm_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        # 取消按钮
        cancel_btn = tk.Button(
            button_frame,
            text="取消",
            command=on_cancel,
            bg=self.styles["cancel_button_color"],
            fg="white",
            font=self.styles["font_family"],
            relief=tk.FLAT,
            padx=20
        )
        cancel_btn.pack(side=tk.RIGHT)
        
        try:
            root.mainloop()
            return {"success": True, "result": result["value"]}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            root.destroy()
    
    def show_violation_modal(self, student_name):
        """显示违纪记录模态框"""
        root = tk.Tk()
        root.title("记录违纪行为")
        root.geometry("620x320")
        root.configure(bg=self.styles["bg_color"])
        root.attributes('-topmost', True)  # 窗口置顶
        
        # 设置窗口居中
        root.eval('tk::PlaceWindow . center')
        
        result = {"notes": "", "confirmed": False}
        
        def on_confirm():
            result["notes"] = text_area.get("1.0", "end-1c").strip()
            result["confirmed"] = True
            root.quit()
            
        def on_cancel():
            result["confirmed"] = False
            root.quit()
        
        # 主框架使用grid布局
        main_frame = tk.Frame(root, bg=self.styles["bg_color"], padx=20, pady=20)
        main_frame.grid(row=0, column=0, sticky="nsew")
        root.grid_rowconfigure(0, weight=1)
        root.grid_columnconfigure(0, weight=1)
        
        # 标题 (第0行)
        title_label = tk.Label(
            main_frame, 
            text="记录违纪行为", 
            font=self.styles["title_font"],
            bg=self.styles["bg_color"],
            fg=self.styles["text_color"]
        )
        title_label.grid(row=0, column=0, pady=(0, 10), sticky="w")
        
        # 学生姓名标签 (第1行)
        student_label = tk.Label(
            main_frame, 
            text=f"学生：{student_name}", 
            font=self.styles["header_font"],
            bg=self.styles["bg_color"],
            fg=self.styles["text_color"]
        )
        student_label.grid(row=1, column=0, pady=(0, 15), sticky="w")
        
        # 备注标签 (第2行)
        notes_label = tk.Label(
            main_frame,
            text="违纪详情：",
            font=self.styles["font_family"],
            bg=self.styles["bg_color"],
            fg=self.styles["text_color"],
            anchor="w"
        )
        notes_label.grid(row=2, column=0, pady=(0, 5), sticky="w")
        
        # 备注文本框框架 (第3行)
        text_frame = tk.Frame(main_frame, relief=tk.SOLID, borderwidth=1, bg=self.styles["border_color"])
        text_frame.grid(row=3, column=0, sticky="nsew", pady=(0, 20))
        
        # 配置行权重
        main_frame.grid_rowconfigure(3, weight=1)  # 文本框行可扩展
        main_frame.grid_rowconfigure(4, weight=0)   # 按钮行固定高度
        main_frame.grid_columnconfigure(0, weight=1)
        
        # 备注文本框
        text_area = tk.Text(
            text_frame,
            font=self.styles["font_family"],
            bd=0,
            highlightthickness=0,
            padx=5,
            pady=5,
            height=10  # 固定行数
        )
        text_area.pack(fill=tk.BOTH, expand=True)
        
        # 按钮框架 (第4行)
        button_frame = tk.Frame(main_frame, bg=self.styles["bg_color"])
        button_frame.grid(row=4, column=0, sticky="ew")
        
        # 确定按钮
        confirm_btn = tk.Button(
            button_frame,
            text="确定",
            command=on_confirm,
            bg=self.styles["button_color"],
            fg="white",
            font=self.styles["font_family"],
            relief=tk.FLAT,
            padx=20
        )
        confirm_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        # 取消按钮
        cancel_btn = tk.Button(
            button_frame,
            text="取消",
            command=on_cancel,
            bg=self.styles["cancel_button_color"],
            fg="white",
            font=self.styles["font_family"],
            relief=tk.FLAT,
            padx=20
        )
        cancel_btn.pack(side=tk.RIGHT)
        
        try:
            root.mainloop()
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            root.destroy()
    
    def show_task_details_modal(self, student_name, records):
        """显示任务详情模态框"""
        root = tk.Tk()
        root.title(f"{student_name} 的任务历史")
        root.geometry("1000x450")
        root.minsize(1000, 450)
        root.configure(bg=self.styles["bg_color"])
        root.attributes('-topmost', True)  # 窗口置顶
        
        result = {"action": None, "index": None}  # action: "delete" 或 None
        
        def on_delete(index):
            # 确认删除
            confirm_root = tk.Tk()
            confirm_root.withdraw()
            try:
                confirm_result = messagebox.askyesno("确认删除", "确定要删除这条记录吗？")
                if confirm_result:
                    result["action"] = "delete"
                    result["index"] = index
                    root.quit()
            finally:
                confirm_root.destroy()
        
        def on_close():
            result["action"] = None
            root.quit()
        
        # 创建主框架
        main_frame = tk.Frame(root, bg=self.styles["bg_color"], padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 标题
        title_label = tk.Label(
            main_frame, 
            text=f"{student_name} 的任务历史", 
            font=self.styles["title_font"],
            bg=self.styles["bg_color"],
            fg=self.styles["text_color"]
        )
        title_label.pack(pady=(0, 15))
        
        # 创建表格框架
        table_container = tk.Frame(main_frame, bg=self.styles["bg_color"])
        table_container.pack(fill=tk.BOTH, expand=True)
        
        # 创建表格画布和滚动区域
        canvas = tk.Canvas(table_container, bg=self.styles["bg_color"], highlightthickness=0)
        scrollbar = tk.Scrollbar(table_container, orient=tk.VERTICAL, command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=self.styles["bg_color"])
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # 表格头部
        headers_frame = tk.Frame(scrollable_frame, bg=self.styles["header_color"], relief=tk.RAISED, bd=1)
        headers_frame.pack(fill=tk.X, pady=(0, 5))
        
        tk.Label(headers_frame, text="时间", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=15, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
        tk.Label(headers_frame, text="去向", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=8, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
        tk.Label(headers_frame, text="时长", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=8, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
        tk.Label(headers_frame, text="备注", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=15, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
        tk.Label(headers_frame, text="操作", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=8, anchor="center").pack(side=tk.LEFT, padx=5, pady=5)
        
        # 添加记录
        if records and len(records) > 0:
            for i, record in enumerate(records):
                # 创建行框架
                row_frame = tk.Frame(scrollable_frame, bg="white" if i % 2 == 0 else "#f8f8f8", relief=tk.SOLID, bd=1)
                row_frame.pack(fill=tk.X, pady=2)
                
                # 格式化时间 - 增强处理逻辑
                if "departureTime" in record and record["departureTime"]:
                    try:
                        parsed_time = parse_datetime_flexible(record["departureTime"])
                        if parsed_time:
                            departure_time = parsed_time.strftime('%Y-%m-%d %H:%M')
                        else:
                            departure_time = "时间格式错误"
                    except Exception:
                        departure_time = "时间解析失败"
                else:
                    departure_time = "无时间"
                
                # 格式化去向
                office = record.get("office", "") if record.get("office") else ""
                
                # 格式化时长
                if "duration" in record and record["duration"]:
                    duration = f"{record['duration']} 分钟"
                else:
                    duration = "未返回"
                
                # 格式化备注
                notes = record.get("notes", "") if record.get("notes") else ""
                
                # 创建单元格
                tk.Label(row_frame, text=departure_time, font=self.styles["font_family"], bg=row_frame.cget("bg"), width=15, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
                tk.Label(row_frame, text=office, font=self.styles["font_family"], bg=row_frame.cget("bg"), width=8, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
                tk.Label(row_frame, text=duration, font=self.styles["font_family"], bg=row_frame.cget("bg"), width=8, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
                tk.Label(row_frame, text=notes, font=self.styles["font_family"], bg=row_frame.cget("bg"), width=15, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
                
                # 删除按钮
                delete_btn = tk.Button(
                    row_frame,
                    text="删除",
                    command=lambda idx=i: on_delete(idx),
                    bg=self.styles["cancel_button_color"],
                    fg="white",
                    font=self.styles["font_family"],
                    relief=tk.FLAT,
                    padx=10
                )
                delete_btn.pack(side=tk.LEFT, padx=5, pady=5)
        else:
            # 无记录提示
            no_records_frame = tk.Frame(scrollable_frame, bg=self.styles["bg_color"])
            no_records_frame.pack(fill=tk.BOTH, expand=True, pady=50)
            tk.Label(no_records_frame, text="暂无记录", font=self.styles["font_family"], bg=self.styles["bg_color"], fg=self.styles["text_color"]).pack()
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
                
        # 居中显示窗口
        root.eval('tk::PlaceWindow . center')
        
        # 绑定鼠标滚轮事件
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/100)), "units")
        
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        try:
            root.mainloop()
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            try:
                canvas.unbind_all("<MouseWheel>")
                root.destroy()
            except Exception:
                pass
    
    def show_violation_details_modal(self, student_name, records):
        """显示违纪详情模态框"""
        root = tk.Tk()
        root.title(f"{student_name} 的违纪记录详情")
        root.geometry("1000x450")
        root.minsize(1000, 450)
        root.configure(bg=self.styles["bg_color"])
        root.attributes('-topmost', True)  # 窗口置顶
        
        result = {"action": None, "index": None}  # action: "delete" 或 None
        
        def on_delete(index):
            # 直接触发删除，让后端处理密码验证
            result["action"] = "delete"
            result["index"] = index
            root.quit()
        
        def on_close():
            result["action"] = None
            root.quit()
        
        # 创建主框架
        main_frame = tk.Frame(root, bg=self.styles["bg_color"], padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 标题
        title_label = tk.Label(
            main_frame, 
            text=f"{student_name} 的违纪记录详情", 
            font=self.styles["title_font"],
            bg=self.styles["bg_color"],
            fg=self.styles["text_color"]
        )
        title_label.pack(pady=(0, 15))
        
        # 创建表格框架
        table_container = tk.Frame(main_frame, bg=self.styles["bg_color"])
        table_container.pack(fill=tk.BOTH, expand=True)
        
        # 创建表格画布和滚动区域
        canvas = tk.Canvas(table_container, bg=self.styles["bg_color"], highlightthickness=0)
        scrollbar = tk.Scrollbar(table_container, orient=tk.VERTICAL, command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=self.styles["bg_color"])
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # 表格头部
        headers_frame = tk.Frame(scrollable_frame, bg=self.styles["header_color"], relief=tk.RAISED, bd=1)
        headers_frame.pack(fill=tk.X, pady=(0, 5))
        
        tk.Label(headers_frame, text="时间", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=20, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
        tk.Label(headers_frame, text="备注", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=30, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
        tk.Label(headers_frame, text="操作", font=self.styles["header_font"], bg=self.styles["header_color"], fg="white", width=10, anchor="center").pack(side=tk.LEFT, padx=5, pady=5)
        
        # 添加记录
        if records and len(records) > 0:
            for i, record in enumerate(records):
                # 创建行框架
                row_frame = tk.Frame(scrollable_frame, bg="white" if i % 2 == 0 else "#f8f8f8", relief=tk.SOLID, bd=1)
                row_frame.pack(fill=tk.X, pady=2)
                
                # 格式化时间 - 增强处理逻辑
                if "time" in record and record["time"]:
                    try:
                        parsed_time = parse_datetime_flexible(record["time"])
                        if parsed_time:
                            record_time = parsed_time.strftime('%Y-%m-%d %H:%M')
                        else:
                            record_time = "时间格式错误"
                    except Exception:
                        record_time = "时间解析失败"
                else:
                    record_time = "无时间"
                
                # 格式化备注
                notes = record.get("notes", "") if record.get("notes") else "无备注"
                
                # 创建单元格
                tk.Label(row_frame, text=record_time, font=self.styles["font_family"], bg=row_frame.cget("bg"), width=20, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
                tk.Label(row_frame, text=notes, font=self.styles["font_family"], bg=row_frame.cget("bg"), width=30, anchor="w").pack(side=tk.LEFT, padx=5, pady=5)
                
                # 删除按钮
                delete_btn = tk.Button(
                    row_frame,
                    text="删除",
                    command=lambda idx=i: on_delete(idx),
                    bg=self.styles["cancel_button_color"],
                    fg="white",
                    font=self.styles["font_family"],
                    relief=tk.FLAT,
                    padx=10
                )
                delete_btn.pack(side=tk.LEFT, padx=5, pady=5)
        else:
            # 无记录提示
            no_records_frame = tk.Frame(scrollable_frame, bg=self.styles["bg_color"])
            no_records_frame.pack(fill=tk.BOTH, expand=True, pady=50)
            tk.Label(no_records_frame, text="暂无违纪记录", font=self.styles["font_family"], bg=self.styles["bg_color"], fg=self.styles["text_color"]).pack()
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # 居中显示窗口
        root.eval('tk::PlaceWindow . center')
        
        # 绑定鼠标滚轮事件
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        try:
            root.mainloop()
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            try:
                canvas.unbind_all("<MouseWheel>")
                root.destroy()
            except Exception:
                pass
    
    def show_delete_confirm_modal(self):
        """显示删除确认模态框"""
        # 直接返回True，跳过密码验证
        return {"success": True, "result": True}

PASSWORD = "3909618495" 

# --- 配置 ---
DATA_FILENAME = "classroom_data.json"
DEFAULT_STUDENTS = [
    "鞠丝雨", "刘心宇", "薛张佰洲", "吴铭杰", "张雨泽", "查萱璐", "吴雨菲", "邱雨馨",
    "洪心诺", "陈钰文", "邬雨峻", "赵紫雯", "周睿涵", "陈天奕", "杨璐萱", "胡馨文",
    "范雨汐", "虞诗铭", "严觅尔", "叶宇轩", "袁胜好", "戴清水", "杨广瀚", "潘昊岩",
    "朱佳慧", "宋歌", "张依婷", "卓悦", "魏科皓", "陈博远", "何鑫", "郑耀鹏",
    "谢紫宁", "俞颖", "厉瑞宇", "金煜翔", "詹瑞淇", "郑轶", "高博", "潘轩宇",
    "包诗琪", "邓佐宁", "张博", "陈翰毅", "李子焕", "沈明昊", "石嘉瑶", " "
]

# --- 全局状态 ---
# 在更复杂的实际应用中，建议使用类属性或数据库
# 这里为了简化，使用全局变量，但通过 API 管理
app_state = {
    "currentStudents": DEFAULT_STUDENTS.copy(),
    "studentsInOffice": {},
    "studentRecords": {},
    "violationRecords": {},
    "tasks": [],
    "timestamp": int(datetime.now().timestamp() * 1000)
}

# --- 初始化 ---
def get_file_path(filename=DATA_FILENAME):
    """获取文件的完整路径"""
    # 简化逻辑，只使用当前目录
    return filename

def parse_datetime_flexible(date_input):
    """
    灵活解析多种时间格式
    支持:
    1. Unix时间戳 (int/float)
    2. ISO 8601字符串格式 (如: "2023-11-23T10:30:00Z")
    3. 已经是datetime对象的情况
    """
    if isinstance(date_input, (int, float)):
        # 时间戳格式 (毫秒)
        if date_input > 1000000000000:  # 毫秒时间戳
            return datetime.fromtimestamp(date_input / 1000)
        else:  # 秒时间戳
            return datetime.fromtimestamp(date_input)
    elif isinstance(date_input, str):
        # 字符串格式，尝试解析ISO 8601格式
        try:
            return parser.parse(date_input)
        except:
            pass
        try:
            # 处理可能的时区信息
            if 'Z' in date_input:
                date_input = date_input.replace('Z', '+00:00')
            # 处理毫秒部分可能超过6位的情况
            if '.' in date_input and '+' in date_input:
                dt_part, tz_part = date_input.split('+')
                if '.' in dt_part:
                    ms_part = dt_part.split('.')[1]
                    if len(ms_part) > 6:
                        dt_part = dt_part[:-(len(ms_part)-6)]
                date_input = dt_part + '+' + tz_part
            elif '.' in date_input and date_input.endswith('00:00'):
                dt_part, tz_part = date_input.rsplit('+', 1)
                if '.' in dt_part:
                    ms_part = dt_part.split('.')[1]
                    if len(ms_part) > 6:
                        dt_part = dt_part[:-(len(ms_part)-6)]
                date_input = dt_part + '+' + tz_part
            
            return datetime.fromisoformat(date_input)
        except:
            # 如果所有方法都失败，返回None
            return None
    elif isinstance(date_input, datetime):
        # 已经是datetime对象
        return date_input
    else:
        # 不支持的格式
        return None

def create_default_data():
    """创建默认数据结构"""
    return {
        "currentStudents": DEFAULT_STUDENTS.copy(),
        "studentsInOffice": {},
        "studentRecords": {student: {"count": 0, "totalDuration": 0, "records": []} for student in DEFAULT_STUDENTS},
        "violationRecords": {student: [] for student in DEFAULT_STUDENTS},
        "tasks": [],
        "timestamp": int(datetime.now().timestamp() * 1000)
    }

def initialize_data_file():
    """初始化数据文件"""
    file_path = get_file_path()

    if not os.path.exists(file_path):
        default_data = create_default_data()
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(default_data, f, ensure_ascii=False, indent=2)
            print(f"Created default data file at {file_path}")
        except Exception as e:
            print(f"Failed to create default data file: {e}")

def load_state_from_disk():
    """从磁盘加载状态到全局变量"""
    global app_state
    file_path = get_file_path()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # 确保所有必要的键都存在，防止加载损坏的文件
        default_data = create_default_data()
        for key in default_data:
            if key not in data:
                data[key] = default_data[key]

        
        # 处理学生记录中的时间格式
        if "studentRecords" in data:
            for student_name, student_data in data["studentRecords"].items():
                if "records" in student_data:
                    for record in student_data["records"]:
                        # 处理departureTime
                        if "departureTime" in record and record["departureTime"]:
                            try:
                                parsed_time = parse_datetime_flexible(record["departureTime"])
                                if parsed_time:
                                    # 转换为毫秒时间戳以保持一致性
                                    record["departureTime"] = int(parsed_time.timestamp() * 1000)
                            except Exception:
                                # 如果解析失败，保持原值
                                pass
                        
                        # 处理returnTime
                        if "returnTime" in record and record["returnTime"]:
                            try:
                                parsed_time = parse_datetime_flexible(record["returnTime"])
                                if parsed_time:
                                    # 转换为毫秒时间戳以保持一致性
                                    record["returnTime"] = int(parsed_time.timestamp() * 1000)
                            except Exception:
                                # 如果解析失败，保持原值
                                pass
        
        # 处理违规记录中的时间格式
        if "violationRecords" in data:
            for student_name, violations in data["violationRecords"].items():
                for violation in violations:
                    if "time" in violation and violation["time"]:
                        try:
                            parsed_time = parse_datetime_flexible(violation["time"])
                            if parsed_time:
                                # 转换为毫秒时间戳以保持一致性
                                violation["time"] = int(parsed_time.timestamp() * 1000)
                        except Exception:
                            # 如果解析失败，保持原值
                            pass
        
        # 检查并清理无效记录：不是今天开始但未返回且持续时间超过500分钟的记录
        current_date = datetime.now().date()
        if "studentRecords" in data:
            for student_name, student_data in data["studentRecords"].items():
                if "records" in student_data:
                    # 从后往前遍历，避免删除元素时索引变化的问题
                    i = len(student_data["records"]) - 1
                    while i >= 0:
                        record = student_data["records"][i]
                        # 检查未返回的记录
                        if record.get("returnTime") is None and record.get("departureTime"):
                            try:
                                departure_time = parse_datetime_flexible(record["departureTime"])
                                if departure_time:
                                    # 检查是否不是今天开始的
                                    if departure_time.date() != current_date:
                                        # 计算持续时间（分钟）
                                        duration = (datetime.now() - departure_time).total_seconds() / 60
                                        # 如果持续时间超过500分钟，则删除该记录
                                        if duration > 500:
                                            student_data["records"].pop(i)
                                            student_data["count"] = max(0, student_data["count"] - 1)
                                            # 更新总时长
                                            student_data["totalDuration"] = max(0, student_data["totalDuration"] - record.get("duration", 0))
                            except Exception:
                                # 忽略处理异常的记录
                                pass
                        i -= 1
        
        app_state = data
        print("State loaded from disk.")
        return True
    except FileNotFoundError:
        print(f"Data file {file_path} not found. Creating default.")
        initialize_data_file()
        load_state_from_disk() # 递归调用一次以加载刚创建的默认文件
        return True
    except Exception as e:
        print(f"Error loading state from disk: {e}. Using default.")
        app_state = create_default_data()
        return False

def save_state_to_disk():
    """将全局状态保存到磁盘"""
    file_path = get_file_path()
    try:
        # 更新时间戳
        app_state['timestamp'] = int(datetime.now().timestamp() * 1000)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(app_state, f, ensure_ascii=False, indent=2, default=str)
        print("State saved to disk.")
        return True
    except Exception as e:
        print(f"Error saving state to disk: {e}")
        return False


def verify_password(prompt="请输入密码:"):
    """
    弹出一个窗口要求用户输入密码
    如果密码正确返回True，否则返回False
    """
    # 使用与其它对话框一致的样式
    styles = {
        "bg_color": "#f0f0f0",
        "button_color": "#4CAF50",
        "cancel_button_color": "#f44336",
        "text_color": "#333333",
        "font_family": ("Microsoft YaHei", 10)
    }
    
    root = tk.Tk()
    root.title("密码验证")
    root.geometry("400x200")
    root.configure(bg=styles["bg_color"])
    root.attributes('-topmost', True)  # 窗口置顶
    root.resizable(False, False)
    
    # 居中显示窗口
    root.eval('tk::PlaceWindow . center')
    
    result = {"value": None}
    
    def on_confirm():
        result["value"] = entry.get()
        root.quit()
        
    def on_cancel():
        result["value"] = None
        root.quit()
        
    def on_entry_confirm(event):
        on_confirm()
    
    # 创建主框架
    main_frame = tk.Frame(root, bg=styles["bg_color"], padx=20, pady=20)
    main_frame.pack(fill=tk.BOTH, expand=True)
    
    # 消息标签
    message_label = tk.Label(
        main_frame,
        text=prompt,
        font=styles["font_family"],
        bg=styles["bg_color"],
        fg=styles["text_color"]
    )
    message_label.pack(pady=(0, 10))
    
    # 密码输入框
    entry = tk.Entry(
        main_frame,
        font=styles["font_family"],
        bg="white",
        fg=styles["text_color"],
        relief=tk.SOLID,
        borderwidth=1,
        show='*'  # 隐藏密码输入
    )
    entry.pack(fill=tk.X, pady=(0, 15))
    entry.focus()
    
    # 绑定回车键确认
    entry.bind('<Return>', on_entry_confirm)
    
    # 按钮框架
    button_frame = tk.Frame(main_frame, bg=styles["bg_color"])
    button_frame.pack(fill=tk.X)
    
    # 确定按钮
    confirm_btn = tk.Button(
        button_frame,
        text="确定",
        command=on_confirm,
        bg=styles["button_color"],
        fg="white",
        font=styles["font_family"],
        relief=tk.FLAT,
        padx=20
    )
    confirm_btn.pack(side=tk.RIGHT, padx=(10, 0))
    
    # 取消按钮
    cancel_btn = tk.Button(
        button_frame,
        text="取消",
        command=on_cancel,
        bg=styles["cancel_button_color"],
        fg="white",
        font=styles["font_family"],
        relief=tk.FLAT,
        padx=20
    )
    cancel_btn.pack(side=tk.RIGHT)
    
    try:
        root.mainloop()
        
        # 检查用户输入
        user_input = result["value"]
        if user_input is None:  # 用户点击取消
            return False
        
        # 验证密码
        if user_input == PASSWORD:
            return True
        else:
            return False
    except Exception as e:
        print(f"Error in password verification: {e}")
        return False
    finally:
        root.destroy()

# --- API 接口 ---
class Api:
    def __init__(self):
        self.dialogs = TKinterDialogs()  # 添加TKinter对话框支持
        # 程序启动时加载一次状态
        load_state_from_disk()

    # --- 文件操作 ---
    def load_state_from_file(self):
        success = load_state_from_disk()
        return {'success': success, 'data': app_state}

    def save_state_to_file(self, data=None):
        # 允许前端传递新数据覆盖，或保存当前全局状态
        if data:
            global app_state
            app_state = data
        success = save_state_to_disk()
        return {'success': success}

    # --- 对话框方法 ---
    def show_custom_alert(self, message):
        """显示自定义警告框"""
        return self.dialogs.show_custom_alert(message)

    def show_custom_confirm(self, message):
        """显示自定义确认框"""
        return self.dialogs.show_custom_confirm(message)

    def show_custom_prompt(self, message, default_value=""):
        """显示自定义输入框"""
        return self.dialogs.show_custom_prompt(message, default_value)

    def show_violation_modal(self, student_name):
        """显示违纪记录模态框"""
        return self.dialogs.show_violation_modal(student_name)

    def show_task_details_modal(self, student_name, records):
        """显示任务详情模态框"""
        return self.dialogs.show_task_details_modal(student_name, records)

    def show_violation_details_modal(self, student_name, records):
        """显示违纪详情模态框"""
        return self.dialogs.show_violation_details_modal(student_name, records)

    def show_delete_confirm_modal(self):
        """显示删除确认模态框"""
        return self.dialogs.show_delete_confirm_modal()

    # --- 核心业务逻辑 ---
    def get_full_state(self):
        """获取完整的应用状态"""
        # 确保所有学生都有记录条目
        for student in DEFAULT_STUDENTS:
            if student not in app_state["studentRecords"]:
                 app_state["studentRecords"][student] = {"count": 0, "totalDuration": 0, "records": []}
            if student not in app_state["violationRecords"]:
                 app_state["violationRecords"][student] = []
            
            # 处理学生记录中的时间格式
            if "studentRecords" in app_state and student in app_state["studentRecords"]:
                student_data = app_state["studentRecords"][student]
                if "records" in student_data:
                    for record in student_data["records"]:
                        # 处理departureTime
                        if "departureTime" in record and record["departureTime"]:
                            try:
                                parsed_time = parse_datetime_flexible(record["departureTime"])
                                if parsed_time:
                                    # 转换为毫秒时间戳以保持一致性
                                    record["departureTime"] = int(parsed_time.timestamp() * 1000)
                            except Exception:
                                # 如果解析失败，保持原值
                                pass
                        
                        # 处理returnTime
                        if "returnTime" in record and record["returnTime"]:
                            try:
                                parsed_time = parse_datetime_flexible(record["returnTime"])
                                if parsed_time:
                                    # 转换为毫秒时间戳以保持一致性
                                    record["returnTime"] = int(parsed_time.timestamp() * 1000)
                            except Exception:
                                # 如果解析失败，保持原值
                                pass
        
            # 处理违规记录中的时间格式
            if "violationRecords" in app_state and student in app_state["violationRecords"]:
                violations = app_state["violationRecords"][student]
                for violation in violations:
                    if "time" in violation and violation["time"]:
                        try:
                            parsed_time = parse_datetime_flexible(violation["time"])
                            if parsed_time:
                                # 转换为毫秒时间戳以保持一致性
                                violation["time"] = int(parsed_time.timestamp() * 1000)
                        except Exception:
                            # 如果解析失败，保持原值
                            pass
        
        return {'success': True, 'data': app_state}

    def set_mode(self, mode):
        """设置当前模式（'registration', 'swap', 'stats'）"""
        # 模式切换逻辑可以在这里处理，如果需要的话
        # 例如，记录模式切换时间等
        # 目前只是简单确认
        if mode in ['registration', 'swap', 'stats']:
            return {'success': True, 'message': f'Mode set to {mode}'}
        else:
            return {'success': False, 'error': 'Invalid mode'}

    def swap_seats(self, student1, student2):
        """交换两个学生的座位"""
        try:
            index1 = app_state["currentStudents"].index(student1)
            index2 = app_state["currentStudents"].index(student2)
            app_state["currentStudents"][index1], app_state["currentStudents"][index2] = \
                app_state["currentStudents"][index2], app_state["currentStudents"][index1]
            save_state_to_disk()
            return {'success': True, 'message': f'Swapped {student1} and {student2}'}
        except ValueError as e:
            return {'success': False, 'error': f'Student not found: {e}'}
        except Exception as e:
            return {'success': False, 'error': f'Failed to swap seats: {e}'}

    def record_departure(self, student_name, office_type, notes=""):
        """记录学生外出"""
        try:
            if office_type == '已离线':
                # 特殊处理"已离线"，不记录任务
                app_state["studentsInOffice"][student_name] = {
                    "officeBox": office_type,
                    "time": int(datetime.now().timestamp() * 1000)
                }
            elif office_type == '其它' or office_type in ['语文', '地理', '技术', '数学', '政治', '历史', '物理', '化学', '生物', '外语', '玉虚宫']:
                # 记录任务
                if student_name not in app_state["studentRecords"]:
                    app_state["studentRecords"][student_name] = {"count": 0, "totalDuration": 0, "records": []}
                record = {
                    "departureTime": int(datetime.now().timestamp() * 1000),
                    "office": office_type,
                    "returnTime": None,
                    "duration": 0,
                    "notes": notes
                }
                app_state["studentRecords"][student_name]["records"].append(record)
                app_state["studentRecords"][student_name]["count"] += 1
                # 标记学生已外出
                app_state["studentsInOffice"][student_name] = {
                    "officeBox": office_type,
                    "time": int(datetime.now().timestamp() * 1000)
                }
            else:
                 return {'success': False, 'error': f'Invalid office type: {office_type}'}

            save_state_to_disk()
            return {'success': True, 'message': f'Recorded departure for {student_name} to {office_type}'}
        except Exception as e:
            return {'success': False, 'error': f'Failed to record departure: {e}'}

    def record_return(self, student_name):
        """记录学生返回"""
        try:
            if student_name in app_state["studentsInOffice"]:
                del app_state["studentsInOffice"][student_name]
            else:
                # 如果学生不在外出列表中，也尝试更新记录（可能从文件加载）
                pass

            # 更新记录中的返回时间和时长
            if student_name in app_state["studentRecords"]:
                records = app_state["studentRecords"][student_name]["records"]
                if records:
                    last_record = records[-1]
                    if last_record["returnTime"] is None:
                        current_time_ms = int(datetime.now().timestamp() * 1000)
                        last_record["returnTime"] = current_time_ms
                        
                        # 获取departureTime，增强处理逻辑
                        try:
                            departure_time = parse_datetime_flexible(last_record["departureTime"])
                            if departure_time:
                                departure_time_ms = int(departure_time.timestamp() * 1000)
                                duration_minutes = max(1, round((current_time_ms - departure_time_ms) / (1000 * 60)))
                            else:
                                duration_minutes = 1  # 默认1分钟
                        except Exception:
                            # 如果解析失败，使用默认值
                            duration_minutes = 1
                        
                        last_record["duration"] = duration_minutes
                        app_state["studentRecords"][student_name]["totalDuration"] += duration_minutes

            save_state_to_disk()
            return {'success': True, 'message': f'Recorded return for {student_name}'}
        except Exception as e:
            return {'success': False, 'error': f'Failed to record return: {e}'}

    def add_task(self, task_text):
        """添加任务"""
        try:
            new_task = {
                "id": int(datetime.now().timestamp() * 1000), # 使用时间戳作为简单ID
                "text": task_text,
                "completed": False
            }
            app_state["tasks"].append(new_task)
            save_state_to_disk()
            return {'success': True, 'message': 'Task added', 'taskId': new_task['id']}
        except Exception as e:
            return {'success': False, 'error': f'Failed to add task: {e}'}

    def delete_task(self, task_id):
        """删除任务"""
        try:
            initial_len = len(app_state["tasks"])
            app_state["tasks"] = [t for t in app_state["tasks"] if t["id"] != task_id]
            if len(app_state["tasks"]) < initial_len:
                save_state_to_disk()
                return {'success': True, 'message': 'Task deleted'}
            else:
                return {'success': False, 'error': 'Task not found'}
        except Exception as e:
            return {'success': False, 'error': f'Failed to delete task: {e}'}

    def add_violation(self, student_name, notes=""):
        """添加违纪记录"""
        if not verify_password():
            return {'success': False, 'error': '密码错误'}

        try:
            if student_name not in app_state["violationRecords"]:
                app_state["violationRecords"][student_name] = []
            new_violation = {
                "time": int(datetime.now().timestamp() * 1000),
                "notes": notes
            }
            app_state["violationRecords"][student_name].append(new_violation)
            save_state_to_disk()
            return {'success': True, 'message': 'Violation recorded'}
        except Exception as e:
            return {'success': False, 'error': f'Failed to record violation: {e}'}


    def delete_record(self, student_name, record_type, index):
        """删除记录（任务记录或违纪记录）"""
        try:

            if not verify_password():
                return {'success': False, 'error': '密码错误'}
        
            if record_type == "record":
                if student_name in app_state["studentRecords"] and 0 <= index < len(app_state["studentRecords"][student_name]["records"]):
                    app_state["studentRecords"][student_name]["records"].pop(index)
                    app_state["studentRecords"][student_name]["count"] = max(0, app_state["studentRecords"][student_name]["count"] - 1)
                    # Recalculate total duration
                    total = 0
                    for r in app_state["studentRecords"][student_name]["records"]:
                        try:
                            # 增强时间处理逻辑
                            if "duration" in r and r["duration"]:
                                total += r["duration"]
                            elif "departureTime" in r and r["departureTime"] and "returnTime" in r and r["returnTime"]:
                                # 如果没有duration但有时间，重新计算
                                dep_time = parse_datetime_flexible(r["departureTime"])
                                ret_time = parse_datetime_flexible(r["returnTime"])
                                if dep_time and ret_time:
                                    duration_minutes = max(1, round((ret_time.timestamp() - dep_time.timestamp()) / 60))
                                    total += duration_minutes
                        except Exception:
                            # 忽略单个记录的计算错误
                            pass
                    app_state["studentRecords"][student_name]["totalDuration"] = total
                    save_state_to_disk()
                    return {'success': True, 'message': 'Record deleted'}
                else:
                    return {'success': False, 'error': 'Record not found'}

            elif record_type == "violation":
                if student_name in app_state["violationRecords"] and 0 <= index < len(app_state["violationRecords"][student_name]):
                    app_state["violationRecords"][student_name].pop(index)
                    save_state_to_disk()
                    return {'success': True, 'message': 'Violation deleted'}
                else:
                     return {'success': False, 'error': 'Violation not found'}
            else:
                return {'success': False, 'error': 'Invalid record type'}

        except Exception as e:
            return {'success': False, 'error': f'Failed to delete record: {e}'}


# --- 启动应用 ---
if __name__ == '__main__':
    api = Api()
    window = webview.create_window(
        "晚自习管理系统",
        "index.html",
        js_api=api,
        maximized=True
    )
    webview.start(debug=False)