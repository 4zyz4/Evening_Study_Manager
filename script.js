document.addEventListener('DOMContentLoaded', function() {
    // 修复pywebview检测逻辑，使其在pywebview环境中能正确检测到API
    const pywebUI = {
        isAvailable: () => {
            // 检查pywebview是否存在且api可用
            try {
                // 在pywebview中，API可能在稍后才注入，所以我们需要更全面的检查
                if (typeof window.pywebview === 'undefined') {
                    return false;
                }
                // 检查是否有API方法
                const hasApi = window.pywebview.api && 
                       typeof window.pywebview.api.get_full_state === 'function';
                console.log('pywebview API检查结果:', hasApi);
                return hasApi;
            } catch (e) {
                console.log('检查pywebview可用性时出错:', e);
                return false;
            }
        },
        loadStateFromFile: function() {
            if (!this.isAvailable()) {
                console.warn('pywebview not available, cannot load from file.');
                return Promise.resolve({ success: false, error: 'pywebview not available' });
            }
            return window.pywebview.api.load_state_from_file();
        },
        saveStateToFile: function(state) {
            if (!this.isAvailable()) {
                console.warn('pywebview not available, cannot save to file.');
                return Promise.resolve({ success: false, error: 'pywebview not available' });
            }
            return window.pywebview.api.save_state_to_file(state);
        },
        // 新增调用Python端模态框的方法
        showCustomAlert: function(message) {
            if (!this.isAvailable()) {
                // 如果pywebview不可用，则使用浏览器原生alert
                alert(message);
                return Promise.resolve({ success: true, result: true });
            }
            return window.pywebview.api.show_custom_alert(message);
        },
        showCustomConfirm: function(message) {
            if (!this.isAvailable()) {
                // 如果pywebview不可用，则使用浏览器原生confirm
                const result = confirm(message);
                return Promise.resolve({ success: true, result: result });
            }
            return window.pywebview.api.show_custom_confirm(message);
        },
        showCustomPrompt: function(message, defaultValue = '') {
            if (!this.isAvailable()) {
                // 如果pywebview不可用，则使用浏览器原生prompt
                const result = prompt(message, defaultValue);
                return Promise.resolve({ success: true, result: result });
            }
            return window.pywebview.api.show_custom_prompt(message, defaultValue);
        },
        /*
        showViolationModal: function(studentName) {
            if (!this.isAvailable()) {
                console.warn('pywebview not available, cannot show violation modal.');
                return Promise.resolve({ success: false, error: 'pywebview not available' });
            }
            return window.pywebview.api.show_violation_modal(studentName);
        },
        */
        showDeleteConfirmModal: function() {
            if (!this.isAvailable()) {
                console.warn('pywebview not available, cannot show delete confirm modal.');
                return Promise.resolve({ success: false, error: 'pywebview not available' });
            }
            return window.pywebview.api.show_delete_confirm_modal();
        }
    };

    const eventListenerMap = new WeakMap();

    function addEventListenerSafely(element, type, listener, options = false) {
        let listeners = eventListenerMap.get(element);
        if (!listeners) {
            listeners = {};
            eventListenerMap.set(element, listeners);
        }
        if (!listeners[type]) {
            element.addEventListener(type, listener, options);
            listeners[type] = listener;
        }
    }

    function removeEventListenerSafely(element, type, options = false) {
        const listeners = eventListenerMap.get(element);
        if (listeners && listeners[type]) {
            element.removeEventListener(type, listeners[type], options);
            delete listeners[type];
        }
    }

    const containerElement = document.querySelector('.container');

    function setContainerOverflow(hidden = true) {
        if (containerElement) {
            containerElement.scrollTop = 0;
            containerElement.style.overflow = hidden ? 'hidden' : 'auto';
        }
    }

    function resetContainerOverflow() {
        setContainerOverflow(false);
    }

    const container = document.querySelector('.container');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // 音频波形可视化相关变量
    let audioContext;
    let analyser;
    let dataArray;
    let canvas;
    let canvasCtx;
    const WAVEFORM_WIDTH = 800;
    const WAVEFORM_HEIGHT = 200;

    // 初始化音频分析器

    const seatsGrid = document.getElementById('seatsGrid');
    const officeBoxes = document.querySelectorAll('.office-box');
    const registrationModeBtn = document.getElementById('registrationMode');
    const swapModeBtn = document.getElementById('swapMode');
    const statsModeBtn = document.getElementById('statsMode');
    const modeIndicator = document.getElementById('modeIndicator');
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const statsTableBody = document.getElementById('statsTableBody');
    
    const mainContentArea = document.getElementById('mainContentArea');
    const statisticsSection = document.getElementById('statisticsSection');
    let currentMode = 'registration';
    let draggedStudent = null;
    let currentViolationStudent = null;
    let currentDeleteContext = null;
    let officeVisitsChartInstance = null;
    let studentTimeChartInstance = null;

    // 简化前端状态，只保留必要的UI状态
    let appState = {
        currentStudents: [],
        studentsInOffice: {},
        studentRecords: {},
        tasks: []
    };

    function updateLocalStateFromPython(pythonState) {
        // 只更新本地状态，不进行额外处理
        appState = pythonState;
    }

    function updateAndRenderAll(pythonState) {
        updateLocalStateFromPython(pythonState);
        generateSeats();
        officeBoxes.forEach(box => updateOfficeBox(box));
        renderTaskList();
        renderStatisticsTable();
    }

    function init() {
        // 添加调试信息
        console.log('检查pywebview可用性:', {
            window_pywebview_exists: typeof window.pywebview !== 'undefined',
            pywebview_api_exists: typeof window.pywebview !== 'undefined' ? window.pywebview.api !== undefined : 'N/A',
            pywebview_available: pywebUI.isAvailable()
        });
        
        // 先进行基础UI渲染，确保即使没有后端数据也有默认显示
        generateSeats();
        setupOfficeBoxes();
        updateModeUI();
        renderTaskList();
        renderStatisticsTable();
        
        // 如果pywebview可用，则从后端获取状态并更新UI
        if (pywebUI.isAvailable()) {
            console.log('正在从后端获取状态...');
            return pywebview.api.get_full_state()
                .then(response => {
                    console.log('后端状态获取结果:', response);
                    if (response.success) {
                        updateAndRenderAll(response.data);
                    }
                })
                .catch(error => {
                    console.error('初始化状态失败:', error);
                });
        } else {
            // 因为pywebview的API可能是异步注入的，所以我们等待一段时间再检查
            console.log('pywebview当前不可用，等待其API注入...');
            
            // 异步检测pywebview
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 10; // 最多尝试10次
                
                const checkPywebview = () => {
                    attempts++;
                    console.log(`检查pywebview可用性 (尝试 ${attempts}/${maxAttempts}):`, {
                        window_pywebview_exists: typeof window.pywebview !== 'undefined',
                        pywebview_api_exists: typeof window.pywebview !== 'undefined' ? window.pywebview.api !== undefined : 'N/A'
                    });
                    
                    if (pywebUI.isAvailable()) {
                        console.log('pywebview现在可用，正在从后端获取状态...');
                        
                        pywebview.api.get_full_state()
                            .then(response => {
                                console.log('后端状态获取结果:', response);
                                if (response.success) {
                                    updateAndRenderAll(response.data);
                                }
                                resolve();
                            })
                            .catch(error => {
                                console.error('初始化状态失败:', error);
                                resolve();
                            });
                    } else if (attempts < maxAttempts) {
                        // 等待一段时间后再次检查
                        setTimeout(checkPywebview, 300);
                    } else {
                        resolve();
                    }
                };
                
                // 开始检查
                setTimeout(checkPywebview, 300);
            });
        }
    }

    let touchDraggedStudent = null;
    let longPressStartTime = 0;
    let isLongPress = false;
    let touchStartX = 0;
    let touchStartY = 0;
    const MOVE_THRESHOLD = 5;
    let touchDragPreview = null;

    function attachSeatEventListeners(seat) {
        addEventListenerSafely(seat, 'dragstart', handleDragStart);
        addEventListenerSafely(seat, 'dragend', handleDragEnd);
        addEventListenerSafely(seat, 'dblclick', handleSeatDoubleClick);
        addEventListenerSafely(seat, 'touchstart', handleTouchStart);
        addEventListenerSafely(seat, 'touchmove', handleTouchMove, { passive: false });
        addEventListenerSafely(seat, 'touchend', handleTouchEnd);
        addEventListenerSafely(seat, 'touchcancel', handleTouchCancel);
        // 移除违纪记录的右键点击事件监听器
        // addEventListenerSafely(seat, 'contextmenu', handleSeatRightClick);
        
        // 添加拖拽相关的事件监听器
        addEventListenerSafely(seat, 'dragover', handleSeatDragOver);
        addEventListenerSafely(seat, 'dragenter', handleSeatDragEnter);
        addEventListenerSafely(seat, 'dragleave', handleSeatDragLeave);
        addEventListenerSafely(seat, 'drop', handleSeatDrop);
    }

    function handleTouchStart(e) {
        if (e.touches.length > 1) return;
        const studentName = this.dataset.student;
        if (!studentName || appState.studentsInOffice[studentName] || studentName === " ") return;
        touchDraggedStudent = this;
        isLongPress = false;
        longPressStartTime = Date.now();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        }

    function handleTouchMove(e) {
        if (!touchDraggedStudent || touchDraggedStudent !== this) return;
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        if (!isLongPress && (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD)) {
            e.preventDefault();
            if (!touchDragPreview) {
                touchDragPreview = document.createElement('div');
                touchDragPreview.textContent = this.dataset.student;
                touchDragPreview.className = 'touch-drag-preview';
                document.body.appendChild(touchDragPreview);
            }
            touchDragPreview.style.left = `${touch.clientX}px`;
            touchDragPreview.style.top = `${touch.clientY}px`;
            
            // 修复：使用elementFromPoint穿透元素找到真正的office-box
            let elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // 循环查找父元素直到找到office-box或者到达根元素
            while (elementUnderTouch && !elementUnderTouch.classList.contains('office-box') && elementUnderTouch !== document.body) {
                elementUnderTouch = elementUnderTouch.parentElement;
            }
            
            if (currentMode === 'registration' && elementUnderTouch && elementUnderTouch.classList.contains('office-box')) {
                officeBoxes.forEach(box => box.classList.remove('highlight'));
                elementUnderTouch.classList.add('highlight');
            } else if (currentMode === 'swap' && elementUnderTouch && elementUnderTouch.classList.contains('seat') && elementUnderTouch !== this && elementUnderTouch.dataset.student) {
                document.querySelectorAll('.seat').forEach(s => s.classList.remove('dragging-over'));
                elementUnderTouch.classList.add('dragging-over');
            }
        }
    }

    function handleTouchEnd(e) {
        if (!touchDraggedStudent || touchDraggedStudent !== this) return;
        if (touchDragPreview) {
            document.body.removeChild(touchDragPreview);
            touchDragPreview = null;
        }
        if (isLongPress) {
            document.querySelectorAll('.seat').forEach(s => s.classList.remove('dragging-over'));
            officeBoxes.forEach(box => box.classList.remove('highlight'));
            touchDraggedStudent = null;
            isLongPress = false;
            return;
        }
        const touch = e.changedTouches[0];
        
        // 修复：使用elementFromPoint穿透元素找到真正的office-box
        let elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // 循环查找父元素直到找到office-box或者到达根元素
        while (elementUnderTouch && !elementUnderTouch.classList.contains('office-box') && elementUnderTouch !== document.body) {
            elementUnderTouch = elementUnderTouch.parentElement;
        }
        
        const studentName = this.dataset.student;
        if (currentMode === 'registration' && studentName) {
            if (elementUnderTouch && elementUnderTouch.classList.contains('office-box')) {
                const officeType = elementUnderTouch.dataset.office;
                const dropEvent = {
                    preventDefault: () => { },
                    dataTransfer: { getData: () => studentName }
                };
                const officeDropHandler = getOfficeBoxDropHandler(elementUnderTouch);
                if (officeDropHandler) {
                    officeDropHandler.call(elementUnderTouch, dropEvent);
                }
            }
        } else if (currentMode === 'swap' && studentName) {
            if (elementUnderTouch && elementUnderTouch.classList.contains('seat') && elementUnderTouch !== this && elementUnderTouch.dataset.student) {
                const targetStudentName = elementUnderTouch.dataset.student;
                if (studentName && targetStudentName && studentName !== targetStudentName) {
                    pywebview.api.swap_seats(studentName, targetStudentName)
                        .then(response => {
                            if (response.success) {
                                return pywebview.api.get_full_state();
                            } else {
                                throw new Error(response.error);
                            }
                        })
                        .then(response => updateAndRenderAll(response.data))
                        .catch(error => pywebUI.showCustomAlert('交换失败: ' + error.message));
                }
            }
        }
        officeBoxes.forEach(box => box.classList.remove('highlight'));
        document.querySelectorAll('.seat').forEach(s => s.classList.remove('dragging-over'));
        touchDraggedStudent = null;
        isLongPress = false;
    }

    function handleTouchCancel(e) {
        officeBoxes.forEach(box => box.classList.remove('highlight'));
        document.querySelectorAll('.seat').forEach(s => s.classList.remove('dragging-over'));
        touchDraggedStudent = null;
        isLongPress = false;
        if (touchDragPreview) {
            document.body.removeChild(touchDragPreview);
            touchDragPreview = null;
        }
    }

    function getOfficeBoxDropHandler(officeBoxElement) {
        return function(e) {
            e.preventDefault();
            const studentName = e.dataTransfer.getData('text/plain');
            const officeType = this.dataset.office;
            if (studentName != " ") {
                if (appState.studentsInOffice[studentName]) return;
                if (officeType === '已离线') {
                    pywebUI.showCustomConfirm(`确定要将 ${studentName} 设置为已离线吗？`).then((response) => {
                        if (!response.success) return;
                        const result = response.result;
                        if (!result) return;
                        pywebview.api.record_departure(studentName, officeType)
                            .then(response => {
                                if (response.success) {
                                    return pywebview.api.get_full_state();
                                } else {
                                    throw new Error(response.error);
                                }
                            })
                            .then(response => updateAndRenderAll(response.data))
                            .catch(error => console.error('操作失败: ' + error.message));
                    });
                    return;
                }
                let notes = '';
                if (officeType === '其它') {
                    pywebUI.showCustomPrompt(`请输入将 ${studentName} 拖动至“其它”类别的备注信息：`).then((response) => {
                        if (!response.success) return;
                        const inputValue = response.result;
                        if (inputValue === null) return;
                        notes = inputValue;
                        pywebview.api.record_departure(studentName, officeType, notes)
                            .then(response => {
                                if (response.success) {
                                    return pywebview.api.get_full_state();
                                } else {
                                    throw new Error(response.error);
                                }
                            })
                            .then(response => updateAndRenderAll(response.data))
                            .catch(error => console.error('操作失败: ' + error.message));
                    });
                    return;
                }
                pywebview.api.record_departure(studentName, officeType)
                    .then(response => {
                        if (response.success) {
                            return pywebview.api.get_full_state();
                        } else {
                            throw new Error(response.error);
                        }
                    })
                    .then(response => updateAndRenderAll(response.data))
                    .catch(error => console.error('操作失败: ' + error.message));
            }
        };
    }


    function generateSeats() {
        seatsGrid.innerHTML = '';
        for (let i = 0; i < 48; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.dataset.id = i + 1;
            if (i < appState.currentStudents.length) {
                const studentName = appState.currentStudents[i];
                seat.textContent = studentName;
                seat.dataset.student = studentName;
                // 添加判断：如果学生名是空格或已被标记为离开，则显示为空座位样式
                if (appState.studentsInOffice[studentName] || studentName.trim() === '') {
                    seat.className = 'seat empty';
                    seat.draggable = false;
                    seat.textContent = '';
                } else {
                    seat.draggable = true;
                }
            } else {
                seat.className = 'seat empty';
                seat.draggable = false;
            }
            seatsGrid.appendChild(seat);
            attachSeatEventListeners(seat);
        }
    }


    function handleDragStart(e) {
        draggedStudent = this;
        e.dataTransfer.setData('text/plain', this.dataset.student);
        this.classList.add('dragging');
        // 不再在拖拽开始时高亮所有办公室
        // 只在悬停时高亮特定办公室
        
        // 解决拖动时被其他元素覆盖的问题
        if (currentMode === 'registration') {
            // 为所有办公室添加拖放相关事件监听器
            officeBoxes.forEach(box => {
                box.classList.add('drag-target');
            });
        }
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        officeBoxes.forEach(box => {
            box.classList.remove('highlight');
            box.classList.remove('drag-target');
        });
    }

    function handleSeatDragOver(e) {
        if (currentMode === 'swap') e.preventDefault();
        // 在注册模式下，当拖拽经过办公室时高亮该办公室
        if (currentMode === 'registration') {
            e.preventDefault(); // 必须调用preventDefault才能触发drop事件
            
            // 查找最近的办公室元素
            let target = e.target;
            while (target && !target.classList.contains('office-box')) {
                target = target.parentElement;
            }
            
            if (target && target.classList.contains('office-box')) {
                officeBoxes.forEach(box => box.classList.remove('highlight'));
                target.classList.add('highlight');
            }
        }
    }

    function handleSeatDragEnter(e) {
        if (currentMode === 'swap') {
            e.preventDefault();
            this.classList.add('dragging-over');
        }
        // 在注册模式下，当拖拽进入办公室时高亮该办公室
        if (currentMode === 'registration') {
            e.preventDefault(); // 必须调用preventDefault才能触发drop事件
            
            // 查找最近的办公室元素
            let target = e.target;
            while (target && !target.classList.contains('office-box')) {
                target = target.parentElement;
            }
            
            if (target && target.classList.contains('office-box')) {
                officeBoxes.forEach(box => box.classList.remove('highlight'));
                target.classList.add('highlight');
            }
        }
    }

    function handleSeatDragLeave(e) {
        this.classList.remove('dragging-over');
        // 在注册模式下，移除所有办公室的高亮
        if (currentMode === 'registration') {
            // 只有当真正离开办公室区域时才移除高亮
            let target = e.relatedTarget;
            // 检查relatedTarget是否在办公室区域内
            let isInOfficeBox = false;
            while (target) {
                if (target.classList && target.classList.contains('office-box')) {
                    isInOfficeBox = true;
                    break;
                }
                target = target.parentElement;
            }
            
            // 如果不是在办公室区域内，则移除高亮
            if (!isInOfficeBox) {
                officeBoxes.forEach(box => box.classList.remove('highlight'));
            }
        }
    }

    function handleSeatDrop(e) {
        if (currentMode === 'swap') {
            e.preventDefault();
            this.classList.remove('dragging-over');
            const draggedStudentName = e.dataTransfer.getData('text/plain');
            const targetStudentName = this.dataset.student;
            if (draggedStudentName && targetStudentName && draggedStudentName !== targetStudentName) {
                pywebview.api.swap_seats(draggedStudentName, targetStudentName)
                    .then(response => {
                        if (response.success) {
                            return pywebview.api.get_full_state();
                        } else {
                            throw new Error(response.error);
                        }
                    })
                    .then(response => updateAndRenderAll(response.data))
                    .catch(error => pywebUI.showCustomAlert('交换失败: ' + error.message));
            }
        }
        
        // 在注册模式下处理拖放到办公室的逻辑
        if (currentMode === 'registration') {
            e.preventDefault();
            
            // 查找最近的办公室元素
            let target = e.target;
            while (target && !target.classList.contains('office-box')) {
                target = target.parentElement;
            }
            
            if (target && target.classList.contains('office-box')) {
                const studentName = e.dataTransfer.getData('text/plain');
                const officeType = target.dataset.office;
                
                if (studentName) {
                    if (appState.studentsInOffice[studentName]) return;
                    if (officeType === '已离线') {
                        pywebUI.showCustomConfirm(`确定要将 ${studentName} 设置为已离线吗？`).then((response) => {
                            if (!response.success) return;
                            const result = response.result;
                            if (!result) return;
                            pywebview.api.record_departure(studentName, officeType)
                                .then(response => {
                                    if (response.success) {
                                        return pywebview.api.get_full_state();
                                    } else {
                                        throw new Error(response.error);
                                    }
                                })
                                .then(response => updateAndRenderAll(response.data))
                                .catch(error => console.error('操作失败: ' + error.message));
                        });
                        return;
                    }
                    let notes = '';
                    if (officeType === '其它') {
                        pywebUI.showCustomPrompt(`请输入将 ${studentName} 拖动至"其它"类别的备注信息：`).then((response) => {
                            if (!response.success) return;
                            const inputValue = response.result;
                            if (inputValue === null) return;
                            notes = inputValue;
                            pywebview.api.record_departure(studentName, officeType, notes)
                                .then(response => {
                                    if (response.success) {
                                        return pywebview.api.get_full_state();
                                    } else {
                                        throw new Error(response.error);
                                    }
                                })
                                .then(response => updateAndRenderAll(response.data))
                                .catch(error => console.error('操作失败: ' + error.message));
                        });
                        return;
                    }
                    pywebview.api.record_departure(studentName, officeType)
                        .then(response => {
                            if (response.success) {
                                return pywebview.api.get_full_state();
                            } else {
                                throw new Error(response.error);
                            }
                        })
                        .then(response => updateAndRenderAll(response.data))
                        .catch(error => console.error('操作失败: ' + error.message));
                }
            }
            
            // 移除所有办公室的高亮
            officeBoxes.forEach(box => box.classList.remove('highlight'));
        }
    }

    function handleSeatDoubleClick() {
        const studentName = this.dataset.student;
        if (appState.studentsInOffice[studentName]) {
            pywebview.api.record_return(studentName)
                .then(response => {
                    if (response.success) {
                        return pywebview.api.get_full_state();
                    } else {
                        throw new Error(response.error);
                    }
                })
                .then(response => updateAndRenderAll(response.data))
                .catch(error => console.error('操作失败: ' + error.message));
        }
    }

    function attachStudentInOfficeEventListeners(studentEl) {
        addEventListenerSafely(studentEl, 'dblclick', handleStudentInOfficeDoubleClick);
        addEventListenerSafely(studentEl, 'touchend', handleStudentInOfficeTouchEnd);
    }

    let lastTouchEnd = 0;

    function handleStudentInOfficeTouchEnd(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            handleStudentInOfficeDoubleClick.call(this, e);
        }
        lastTouchEnd = now;
    }

    function handleStudentInOfficeDoubleClick(e) {
        const studentName = this.dataset.student;
        pywebview.api.record_return(studentName)
            .then(response => {
                if (response.success) {
                        return pywebview.api.get_full_state();
                    } else {
                        throw new Error(response.error);
                    }
                })
                .then(response => updateAndRenderAll(response.data))
                .catch(error => console.error('操作失败: ' + error.message));
    }

    function setupOfficeBoxes() {
        officeBoxes.forEach(box => {
            removeEventListenerSafely(box, 'dragover');
            removeEventListenerSafely(box, 'dragenter');
            removeEventListenerSafely(box, 'dragleave');
            removeEventListenerSafely(box, 'drop');
            removeEventListenerSafely(box, 'dblclick');
            addEventListenerSafely(box, 'dragover', function(e) {
                e.preventDefault();
            });
            addEventListenerSafely(box, 'dragenter', function(e) {
                e.preventDefault();
                // 只有在注册模式下才高亮显示
                if (currentMode === 'registration') {
                    this.classList.add('highlight');
                }
            });
            addEventListenerSafely(box, 'dragleave', function(e) {
                // 检查鼠标是否真的离开了这个办公室区域
                let target = e.relatedTarget;
                let isStillInside = false;
                
                // 检查relatedTarget是否还在当前办公室内
                while (target) {
                    if (target === this) {
                        isStillInside = true;
                        break;
                    }
                    target = target.parentElement;
                }
                
                // 只有真正离开时才移除高亮
                if (!isStillInside) {
                    this.classList.remove('highlight');
                }
            });
            addEventListenerSafely(box, 'drop', function(e) {
                e.preventDefault();
                this.classList.remove('highlight');
                
                // 处理拖放到办公室的逻辑
                if (currentMode === 'registration') {
                    const studentName = e.dataTransfer.getData('text/plain');
                    const officeType = this.dataset.office;
                    
                    if (studentName != " ") {
                        if (appState.studentsInOffice[studentName]) return;
                        if (officeType === '已离线') {
                            pywebUI.showCustomConfirm(`确定要将 ${studentName} 设置为已离线吗？`).then((response) => {
                                if (!response.success) return;
                                const result = response.result;
                                if (!result) return;
                                pywebview.api.record_departure(studentName, officeType)
                                    .then(response => {
                                        if (response.success) {
                                            return pywebview.api.get_full_state();
                                        } else {
                                            throw new Error(response.error);
                                        }
                                    })
                                    .then(response => updateAndRenderAll(response.data))
                                    .catch(error => console.error('操作失败: ' + error.message));
                            });
                            return;
                        }
                        let notes = '';
                        if (officeType === '其它') {
                            pywebUI.showCustomPrompt(`请输入将 ${studentName} 拖动至"其它"类别的备注信息：`).then((response) => {
                                if (!response.success) return;
                                const inputValue = response.result;
                                if (inputValue === null) return;
                                notes = inputValue;
                                pywebview.api.record_departure(studentName, officeType, notes)
                                    .then(response => {
                                        if (response.success) {
                                            return pywebview.api.get_full_state();
                                        } else {
                                            throw new Error(response.error);
                                        }
                                    })
                                    .then(response => updateAndRenderAll(response.data))
                                    .catch(error => console.error('操作失败: ' + error.message));
                            });
                            return;
                        }
                        pywebview.api.record_departure(studentName, officeType)
                            .then(response => {
                                if (response.success) {
                                    return pywebview.api.get_full_state();
                                } else {
                                    throw new Error(response.error);
                                }
                            })
                            .then(response => updateAndRenderAll(response.data))
                            .catch(error => console.error('操作失败: ' + error.message));
                    }
                }
            });
            addEventListenerSafely(box, 'dblclick', function(e) {
                if (e.target.classList.contains('student-in-office')) {
                    handleStudentInOfficeDoubleClick.call(e.target, e);
                }
            });
            updateOfficeBox(box);
        });
    }

    function updateOfficeBox(box) {
        const officeType = box.dataset.office;
        const studentsInThisOffice = [];
        for (const student in appState.studentsInOffice) {
            if (appState.studentsInOffice[student].officeBox === officeType) {
                studentsInThisOffice.push(student);
            }
        }
        box.innerHTML = officeType;
        studentsInThisOffice.forEach(student => {
            const studentEl = document.createElement('div');
            studentEl.className = 'student-in-office';
            studentEl.textContent = student;
            studentEl.dataset.student = student;
            attachStudentInOfficeEventListeners(studentEl);
            box.appendChild(studentEl);
        });
    }

    function updateModeUI() {
        registrationModeBtn.classList.remove('active');
        swapModeBtn.classList.remove('active');
        statsModeBtn.classList.remove('active');
        mainContentArea.style.display = 'none';
        statisticsSection.style.display = 'none';
        if (currentMode === 'registration') {
            registrationModeBtn.classList.add('active');
            modeIndicator.className = 'mode-indicator registration-mode';
            modeIndicator.textContent = '任务模式：外出任务记录';
            mainContentArea.style.display = 'flex';
        } else if (currentMode === 'swap') {
            swapModeBtn.classList.add('active');
            modeIndicator.className = 'mode-indicator swap-mode';
            modeIndicator.textContent = '领域模式：领域变更操作';
            mainContentArea.style.display = 'flex';
        } else if (currentMode === 'stats') {
            statsModeBtn.classList.add('active');
            modeIndicator.className = 'mode-indicator stats-mode';
            modeIndicator.textContent = '存档记录：查看历史数据';
            statisticsSection.style.display = 'block';
        }
    }

    registrationModeBtn.addEventListener('click', function() {
        currentMode = 'registration';
        updateModeUI();
    });

    swapModeBtn.addEventListener('click', function() {
        currentMode = 'swap';
        updateModeUI();
    });

    statsModeBtn.addEventListener('click', function() {
        currentMode = 'stats';
        updateModeUI();
    });

    swapModeBtn.addEventListener('dblclick', function() {
        currentMode = 'registration';
        updateModeUI();
    });

    addTaskBtn.addEventListener('click', function() {
        const taskText = taskInput.value.trim();
        if (taskText) {
            pywebview.api.add_task(taskText)
                .then(response => {
                    if (response.success) {
                        taskInput.value = '';
                        return pywebview.api.get_full_state();
                    } else {
                        throw new Error(response.error);
                    }
                })
                .then(response => updateAndRenderAll(response.data))
                .catch(error => console.error('添加任务失败: ' + error.message));
        }
    });

    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTaskBtn.click();
    });

    function renderTaskList() {
        taskList.innerHTML = '';
        appState.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            const span = document.createElement('span');
            span.textContent = task.text;
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            addEventListenerSafely(deleteBtn, 'touchend', function(e) {
                e.preventDefault();
                // 使用Python端的删除确认模态框
                pywebUI.showDeleteConfirmModal().then((response) => {
                    if (!response.success) {
                        console.error('无法显示删除确认模态框:', response.error);
                        return;
                    }
                    
                    const result = response.result;
                    if (result) {
                        pywebview.api.delete_task(task.id)
                            .then(response => {
                                if (response.success) {
                                    return pywebview.api.get_full_state();
                                } else {
                                    throw new Error(response.error);
                                }
                            })
                            .then(response => updateAndRenderAll(response.data))
                            .catch(error => console.error('删除任务失败: ' + error.message));
                    }
                });
            });
            addEventListenerSafely(deleteBtn, 'click', function() {
                // 使用Python端的删除确认模态框
                pywebUI.showDeleteConfirmModal().then((response) => {
                    if (!response.success) {
                        console.error('无法显示删除确认模态框:', response.error);
                        return;
                    }
                    
                    const result = response.result;
                    if (result) {
                        pywebview.api.delete_task(task.id)
                            .then(response => {
                                if (response.success) {
                                    return pywebview.api.get_full_state();
                                } else {
                                    throw new Error(response.error);
                                }
                            })
                            .then(response => updateAndRenderAll(response.data))
                            .catch(error => console.error('删除任务失败: ' + error.message));
                    }
                });
            });
            li.appendChild(span);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }

    function getRecent7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    function processOfficeVisitsData() {
        const recentDays = getRecent7Days();
        const officeTypes = ['语文', '地理', '技术', '数学', '政治', '历史', '物理', '化学', '生物', '外语', '玉虚宫', '其它'];
        const data = {};
        officeTypes.forEach(office => {
            data[office] = new Array(7).fill(0);
        });
        for (const studentName in appState.studentRecords) {
            const records = appState.studentRecords[studentName].records;
            records.forEach(record => {
                if (record.departureTime && record.office && record.office !== '已离线') {
                    let departureDate;
                    if (typeof record.departureTime === 'number') {
                        departureDate = new Date(record.departureTime);
                    } else if (typeof record.departureTime === 'string') {
                        departureDate = new Date(record.departureTime);
                    } else if (record.departureTime instanceof Date) {
                        departureDate = record.departureTime;
                    }
                    if (departureDate && !isNaN(departureDate.getTime())) {
                        const recordDateStr = departureDate.toISOString().split('T')[0];
                        const dayIndex = recentDays.indexOf(recordDateStr);
                        if (dayIndex !== -1) {
                            data[record.office][dayIndex]++;
                        }
                    }
                }
            });
        }
        return { labels: recentDays, datasets: data };
    }

    function processStudentTimeData() {
        const recentDays = getRecent7Days();
        const studentTimeMap = {};
        for (const studentName in appState.studentRecords) {
            let totalMinutes = 0;
            const records = appState.studentRecords[studentName].records;
            records.forEach(record => {
                if (record.departureTime && record.office && record.office !== '已离线' && record.duration) {
                    let departureDate;
                    if (typeof record.departureTime === 'number') {
                        departureDate = new Date(record.departureTime);
                    } else if (typeof record.departureTime === 'string') {
                        departureDate = new Date(record.departureTime);
                    } else if (record.departureTime instanceof Date) {
                        departureDate = record.departureTime;
                    }
                    if (departureDate && !isNaN(departureDate.getTime())) {
                        const recordDateStr = departureDate.toISOString().split('T')[0];
                        if (recentDays.includes(recordDateStr)) {
                            totalMinutes += record.duration;
                        }
                    }
                }
            });
            if (totalMinutes > 0) {
                studentTimeMap[studentName] = totalMinutes;
            }
        }
        const sortedStudents = Object.entries(studentTimeMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(item => item[0]);
        const datasets = sortedStudents.map(studentName => {
            const dailyData = new Array(7).fill(0);
            const records = appState.studentRecords[studentName].records;
            records.forEach(record => {
                if (record.departureTime && record.office && record.office !== '已离线' && record.duration) {
                    let departureDate;
                    if (typeof record.departureTime === 'number') {
                        departureDate = new Date(record.departureTime);
                    } else if (typeof record.departureTime === 'string') {
                        departureDate = new Date(record.departureTime);
                    } else if (record.departureTime instanceof Date) {
                        departureDate = record.departureTime;
                    }
                    if (departureDate && !isNaN(departureDate.getTime())) {
                        const recordDateStr = departureDate.toISOString().split('T')[0];
                        const dayIndex = recentDays.indexOf(recordDateStr);
                        if (dayIndex !== -1) {
                            dailyData[dayIndex] += record.duration;
                        }
                    }
                }
            });
            return {
                label: studentName,
                data: dailyData,
                fill: false,
                borderColor: getRandomColor(),
                tension: 0.1
            };
        });
        return { labels: recentDays, datasets: datasets };
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function renderCharts() {
        const officeData = processOfficeVisitsData();
        const officeCtx = document.getElementById('officeVisitsChart').getContext('2d');
        if (officeVisitsChartInstance) {
            officeVisitsChartInstance.destroy();
        }
        const officeDatasets = [];
        const officeTypes = ['语文', '地理', '技术', '数学', '政治', '历史', '物理', '化学', '生物', '外语', '玉虚宫', '其它'];
        officeTypes.forEach(office => {
            if (officeData.datasets[office]) {
                officeDatasets.push({
                    label: office,
                    data: officeData.datasets[office],
                    borderColor: getRandomColor(),
                    backgroundColor: 'rgba(0,0,0,0)',
                    tension: 0.1
                });
            }
        });
        officeVisitsChartInstance = new Chart(officeCtx, {
            type: 'line',
            data: {
                labels: officeData.labels,
                datasets: officeDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e0e0e0'
                        }
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '日期',
                            color: '#e0e0e0'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '访问次数',
                            color: '#e0e0e0'
                        },
                        ticks: {
                            beginAtZero: true,
                            color: '#e0e0e0',
                            precision: 0
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        const studentData = processStudentTimeData();
        const studentCtx = document.getElementById('studentTimeChart').getContext('2d');
        if (studentTimeChartInstance) {
            studentTimeChartInstance.destroy();
        }
        studentTimeChartInstance = new Chart(studentCtx, {
            type: 'line',
            data: {
                labels: studentData.labels,
                datasets: studentData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e0e0e0'
                        }
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '日期',
                            color: '#e0e0e0'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '出教室时间 (分钟)',
                            color: '#e0e0e0'
                        },
                        ticks: {
                            beginAtZero: true,
                            color: '#e0e0e0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    function renderStatisticsTable() {
        statsTableBody.innerHTML = '';
        const sortedStudents = [...appState.currentStudents].sort((a, b) => {
            return a.localeCompare(b);
        });
        sortedStudents.forEach(student => {

            if (student === ' ') {
                return; // 跳过本次循环
            }
            const tr = document.createElement('tr');
            const violationCount = appState.violationRecords[student] ? appState.violationRecords[student].length : 0;
            if (violationCount > 0) {
                tr.classList.add('violation-row');
            }
            const nameTd = document.createElement('td');
            nameTd.textContent = student;
            tr.appendChild(nameTd);
            const countTd = document.createElement('td');
            countTd.textContent = appState.studentRecords[student] ? appState.studentRecords[student].count : 0;
            tr.appendChild(countTd);
            const durationTd = document.createElement('td');
            let totalDuration = 0;
            if (appState.studentRecords[student]) {
                appState.studentRecords[student].records.forEach(record => {
                    if (record.office !== '玉虚宫') {
                        const recordDuration = record.duration < 1 ? 1 : record.duration;
                        totalDuration += recordDuration || 0;
                    }
                });
            }
            durationTd.textContent = `${totalDuration} 分钟`;
            tr.appendChild(durationTd);
            const detailsTd = document.createElement('td');
            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'details-btn';
            detailsBtn.textContent = '任务详情';
            addEventListenerSafely(detailsBtn, 'touchend', function(e) {
                e.preventDefault();
                showDetailsModal(student);
            });
            addEventListenerSafely(detailsBtn, 'click', function() {
                showDetailsModal(student);
            });
            detailsTd.appendChild(detailsBtn);
            tr.appendChild(detailsTd);
            statsTableBody.appendChild(tr);
        });
        updateSeatHighlights();
        renderCharts();
    }

    function updateSeatHighlights() {
        const seats = document.querySelectorAll('.seat');
        seats.forEach(seat => {
            const studentName = seat.dataset.student;
            if (studentName) {
                seat.classList.remove('violation');
            }
        });
    }

    function showDetailsModal(student) {
        // 获取学生任务记录
        const records = appState.studentRecords[student] ? appState.studentRecords[student].records : [];
        
        // 直接调用Python端的任务详情模态框
        pywebview.api.show_task_details_modal(student, records)
            .then(response => {
                if (!response.success) {
                    console.error('无法显示任务详情模态框:', response.error);
                    return;
                }
                
                const result = response.result;
                // 如果用户执行了删除操作
                if (result.action === "delete" && result.index !== null) {
                    pywebview.api.delete_record(student, 'record', result.index)
                        .then(response => {
                            if (response.success) {
                                return pywebview.api.get_full_state();
                            } else {
                                throw new Error(response.error);
                            }
                        })
                        .then(response => {
                            updateAndRenderAll(response.data);
                        })
                        .catch(error => console.error('删除任务记录失败: ' + error.message));
                }
            })
            .catch(error => console.error('显示任务详情失败: ' + error.message));
    }


    // 页面加载完成后立即初始化
    init().then(() => {
        console.log('应用初始化完成');
    }).catch(error => {
        console.error('应用初始化失败:', error);
    });
});