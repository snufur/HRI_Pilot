// ========== 全局配置 ==========
const CONFIG = {
    API_KEY: 'sk-izbupvpfiixwvwisbyshnnibdsbuaikpynrehgaapnzyheuc',
    API_URL: 'https://api.siliconflow.cn/v1/chat/completions',
    TEXT_CONFIG: {
        font: 'SimHei, Arial, sans-serif',
        mainTextHeight: '2.5vh',
        titleHeight: '3vh',
        smallTextHeight: '2vh',
        mainColor: '#000000',
        highlightColor: '#FF8C00',
        tipColor: '#808080'
    }
};

// ========== 实验数据管理 ==========
class ExperimentData {
    constructor(participantInfo) {
        this.participantInfo = participantInfo;
        this.data = [];
        this.loadExistingData(); // 加载现有数据
    }

    // 加载现有数据
    loadExistingData() {
        try {
            const storageKey = `experiment_data_${this.participantInfo.participant}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                this.data = JSON.parse(savedData);
                console.log(`加载了 ${this.data.length} 条现有数据`);
            }
        } catch (error) {
            console.error('加载现有数据失败:', error);
        }
    }

    // 保存数据到本地存储
    saveToLocalStorage() {
        try {
            const storageKey = `experiment_data_${this.participantInfo.participant}`;
            localStorage.setItem(storageKey, JSON.stringify(this.data));
            console.log('数据已保存到本地存储');
        } catch (error) {
            console.error('保存到本地存储失败:', error);
        }
    }

    // 检查是否有未完成的实验数据
    static checkExistingData(participantId) {
        try {
            const storageKey = `experiment_data_${participantId}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                return {
                    exists: true,
                    data: data,
                    lastPhase: this.getLastPhase(data)
                };
            }
            return { exists: false };
        } catch (error) {
            console.error('检查现有数据失败:', error);
            return { exists: false };
        }
    }

    // 获取最后完成的阶段
    static getLastPhase(data) {
        if (!data || data.length === 0) return null;
        
        const phases = data.map(item => item.phase);
        const phaseOrder = ['pretest', 'practice', 'experiment', 'block_questionnaire'];
        
        let lastPhase = null;
        for (const phase of phaseOrder) {
            if (phases.includes(phase)) {
                lastPhase = phase;
            }
        }
        
        return lastPhase;
    }

    // 添加数据条目
    addData(phase, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            phase: phase,
            participant: this.participantInfo.participant,
            name: this.participantInfo.name,
            phone: this.participantInfo.phone,
            ...data
        };
        this.data.push(entry);
        
        // 立即保存到本地存储
        this.saveToLocalStorage();
        
        // 添加调试信息
        console.log(`添加数据 - 阶段: ${phase}`, entry);
        console.log(`当前数据总数: ${this.data.length}`);
    }

    // 保存数据到文件
    saveData() {
        const filename = `pilot_${this.participantInfo.participant}_${this.getDateStr()}`;
        
        // 添加调试信息
        console.log('正在保存数据...');
        console.log('数据条数:', this.data.length);
        console.log('参与者信息:', this.participantInfo);
        console.log('数据内容:', this.data);
        
        const jsonData = JSON.stringify(this.data, null, 2);
        console.log('JSON数据:', jsonData);
        
        try {
            this.downloadFile(jsonData, `${filename}.json`, 'application/json');
            console.log('JSON文件下载成功');
        } catch (error) {
            console.error('JSON文件下载失败:', error);
        }
        
        const csvData = this.convertToCSV();
        console.log('CSV数据:', csvData);
        
        try {
            this.downloadFile(csvData, `${filename}.csv`, 'text/csv');
            console.log('CSV文件下载成功');
        } catch (error) {
            console.error('CSV文件下载失败:', error);
        }
        
        // 显示保存成功消息
        alert(`数据保存完成！\n文件名: ${filename}\n请检查您的下载文件夹。\n\n如果文件没有下载，请检查浏览器设置是否允许自动下载。`);
    }

    // 转换为CSV格式
    convertToCSV() {
        if (this.data.length === 0) return '';
        
        // 收集所有可能的字段
        const allFields = new Set();
        for (const row of this.data) {
            Object.keys(row).forEach(key => allFields.add(key));
        }
        
        // 转换为数组并排序，确保列的顺序一致
        const headers = Array.from(allFields).sort();
        const csvRows = [headers.join(',')];
        
        for (const row of this.data) {
            const values = headers.map(header => {
                const value = row[header];
                // 处理undefined、null或空值
                if (value === undefined || value === null) {
                    return '';
                }
                // 处理包含逗号或引号的字符串
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    // 下载文件
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 获取日期字符串
    getDateStr() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/:/g, 'h').replace('T', '_');
    }
}

// ========== UI界面管理 ==========
class ExperimentUI {
    constructor() {
        this.setupStyles();
    }

    // 设置CSS样式
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .experiment-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: ${CONFIG.TEXT_CONFIG.font};
                z-index: 1000;
            }
            .text-display {
                max-width: 80vw;
                text-align: center;
                line-height: 1.6;
                margin: 20px;
                white-space: pre-wrap;
                font-size: ${CONFIG.TEXT_CONFIG.mainTextHeight};
                color: ${CONFIG.TEXT_CONFIG.mainColor};
            }
            .score-container {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                margin: 30px 0;
            }
            .score-option {
                width: 60px;
                height: 60px;
                border: 2px solid black;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.2s;
                user-select: none;
            }
            .score-option.selected {
                background: red;
                color: white;
                border-color: red;
                transform: scale(1.1);
            }
            .score-option.disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }
            .score-option:not(.disabled):hover {
                background: #f0f0f0;
                transform: scale(1.05);
            }
            .input-section {
                width: 80%;
                max-width: 600px;
                margin: 20px 0;
            }
            .input-section textarea {
                width: 100%;
                height: 120px;
                padding: 15px;
                border: 2px solid #ccc;
                border-radius: 8px;
                font-family: ${CONFIG.TEXT_CONFIG.font};
                font-size: 20px;
                resize: vertical;
                box-sizing: border-box;
            }
            .input-section textarea:focus {
                outline: none;
                border-color: #4CAF50;
            }
            .button-group {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 20px;
            }
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 20px;
                font-family: ${CONFIG.TEXT_CONFIG.font};
                transition: background 0.3s;
            }
            .btn-primary { 
                background: #4CAF50; 
                color: white; 
            }
            .btn-primary:hover { background: #45a049; }
            .btn-secondary { 
                background: #f44336; 
                color: white; 
            }
            .btn-secondary:hover { background: #da190b; }
            .btn-default { 
                background: #2196F3; 
                color: white; 
            }
            .btn-default:hover { background: #0b7dda; }
            .btn:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }
            .progress-text {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: ${CONFIG.TEXT_CONFIG.smallTextHeight};
                color: ${CONFIG.TEXT_CONFIG.tipColor};
            }
            .countdown-text {
                font-size: ${CONFIG.TEXT_CONFIG.mainTextHeight};
                color: ${CONFIG.TEXT_CONFIG.highlightColor};
                font-weight: bold;
                margin: 20px 0;
            }
            .scenario-display {
                width: 80%;
                max-width: 800px;
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 5px solid #4CAF50;
                max-height: 40vh;
                overflow-y: auto;
            }
            .scenario-display h3 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                font-size: ${CONFIG.TEXT_CONFIG.titleHeight};
            }
            .scenario-content {
                line-height: 1.8;
                font-size: ${CONFIG.TEXT_CONFIG.mainTextHeight};
                color: ${CONFIG.TEXT_CONFIG.mainColor};
                white-space: pre-wrap;
            }
            .input-prompt {
                font-size: ${CONFIG.TEXT_CONFIG.mainTextHeight};
                color: ${CONFIG.TEXT_CONFIG.mainColor};
                margin-bottom: 15px;
                font-weight: bold;
            }
            .scenario-input {
                width: 100%;
                height: 100px;
                padding: 15px;
                border: 2px solid #ccc;
                border-radius: 8px;
                font-family: ${CONFIG.TEXT_CONFIG.font};
                font-size: 20px;
                resize: vertical;
                box-sizing: border-box;
            }
            .scenario-input:focus {
                outline: none;
                border-color: #4CAF50;
            }
            .reply-display {
                width: 80%;
                max-width: 800px;
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 5px solid #4CAF50;
                min-height: 100px;
                height: auto;
                overflow: hidden;
                box-sizing: border-box;
            }
            .reply-content {
                line-height: 1.8;
                font-size: ${CONFIG.TEXT_CONFIG.mainTextHeight};
                color: #4667e0;
                white-space: pre-wrap;
                word-wrap: break-word;
                word-break: break-all;
                margin: 0;
                padding: 0;
            }
        `;
        document.head.appendChild(style);
    }

    // 显示文本屏幕
    showScreen(content, options = {}) {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'text-display';
            textDiv.style.cssText = `
                white-space: pre-line;
                line-height: 1.6;
                font-size: 20px;
                text-align: left;
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
            `;
            textDiv.textContent = content;
            screen.appendChild(textDiv);
            
            if (options.showContinue) {
                const continueText = document.createElement('div');
                continueText.className = 'text-display';
                continueText.textContent = '按回车键继续...';
                continueText.style.cssText = `
                    color: ${CONFIG.TEXT_CONFIG.tipColor};
                    text-align: center;
                    margin-top: 20px;
                `;
                screen.appendChild(continueText);
            }
            
            document.body.appendChild(screen);
            
            const handleKeyPress = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    document.removeEventListener('keydown', handleKeyPress);
                    document.body.removeChild(screen);
                    resolve();
                } else if (event.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyPress);
                    document.body.removeChild(screen);
                    resolve('escape');
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
        });
    }

    // 显示主屏幕输入窗口
    showMainScreenInput(prompt, defaultValue = '') {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            const promptDiv = document.createElement('div');
            promptDiv.className = 'text-display';
            promptDiv.textContent = prompt;
            screen.appendChild(promptDiv);
            
            const inputSection = document.createElement('div');
            inputSection.className = 'input-section';
            
            const textarea = document.createElement('textarea');
            textarea.value = defaultValue;
            textarea.placeholder = '请输入内容...';
            inputSection.appendChild(textarea);
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';
            
            const sendBtn = document.createElement('button');
            sendBtn.className = 'btn btn-primary';
            sendBtn.textContent = '发送 (Ctrl+Enter)';
            sendBtn.onclick = () => {
                const value = textarea.value.trim();
                if (value) {
                    document.body.removeChild(screen);
                    resolve(value);
                }
            };
            
            const clearBtn = document.createElement('button');
            clearBtn.className = 'btn btn-secondary';
            clearBtn.textContent = '清空';
            clearBtn.onclick = () => {
                textarea.value = '';
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-default';
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = () => {
                document.body.removeChild(screen);
                resolve('cancel'); // 返回'cancel'而不是空字符串
            };
            
            buttonGroup.appendChild(sendBtn);
            buttonGroup.appendChild(clearBtn);
            buttonGroup.appendChild(cancelBtn);
            inputSection.appendChild(buttonGroup);
            screen.appendChild(inputSection);
            
            document.body.appendChild(screen);
            textarea.focus();
            
            const handleKeyPress = (event) => {
                if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    sendBtn.click();
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelBtn.click();
                }
            };
            
            textarea.addEventListener('keydown', handleKeyPress);
            
            // 清理事件监听器
            const cleanup = () => {
                textarea.removeEventListener('keydown', handleKeyPress);
            };
            
            // 修改按钮点击事件，确保清理事件监听器
            const originalSendBtnClick = sendBtn.onclick;
            sendBtn.onclick = () => {
                const value = textarea.value.trim();
                if (value) {
                    cleanup();
                    document.body.removeChild(screen);
                    resolve(value);
                }
            };
            
            const originalCancelBtnClick = cancelBtn.onclick;
            cancelBtn.onclick = () => {
                cleanup();
                document.body.removeChild(screen);
                resolve('cancel'); // 返回'cancel'而不是'escape'
            };
        });
    }

    // 显示场景和输入框在同一屏幕
    showScenarioWithInput(scenarioText, inputPrompt, defaultValue = '') {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            // 创建场景显示区域
            const scenarioDiv = document.createElement('div');
            scenarioDiv.className = 'scenario-display';
            scenarioDiv.innerHTML = `<h3>情境：</h3><div class="scenario-content">${scenarioText}</div>`;
            screen.appendChild(scenarioDiv);
            
            // 创建输入区域
            const inputSection = document.createElement('div');
            inputSection.className = 'input-section';
            
            const inputPromptDiv = document.createElement('div');
            inputPromptDiv.className = 'input-prompt';
            inputPromptDiv.textContent = inputPrompt;
            inputSection.appendChild(inputPromptDiv);
            
            const textarea = document.createElement('textarea');
            textarea.value = defaultValue;
            textarea.placeholder = '请输入你的提问或请求...';
            textarea.className = 'scenario-input';
            inputSection.appendChild(textarea);
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';
            
            const sendBtn = document.createElement('button');
            sendBtn.className = 'btn btn-primary';
            sendBtn.textContent = '发送 (Ctrl+Enter)';
            sendBtn.onclick = () => {
                const value = textarea.value.trim();
                if (value) {
                    document.body.removeChild(screen);
                    resolve(value);
                }
            };
            
            const clearBtn = document.createElement('button');
            clearBtn.className = 'btn btn-secondary';
            clearBtn.textContent = '清空';
            clearBtn.onclick = () => {
                textarea.value = '';
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-default';
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = () => {
                document.body.removeChild(screen);
                resolve('cancel'); // 返回'cancel'而不是'escape'
            };
            
            buttonGroup.appendChild(sendBtn);
            buttonGroup.appendChild(clearBtn);
            buttonGroup.appendChild(cancelBtn);
            inputSection.appendChild(buttonGroup);
            screen.appendChild(inputSection);
            
            document.body.appendChild(screen);
            textarea.focus();
            
            const handleKeyPress = (event) => {
                if (event.key === 'Enter' && event.ctrlKey) {
                    event.preventDefault();
                    sendBtn.click();
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelBtn.click();
                }
            };
            
            textarea.addEventListener('keydown', handleKeyPress);
            
            // 清理事件监听器
            const cleanup = () => {
                textarea.removeEventListener('keydown', handleKeyPress);
            };
            
            // 修改按钮点击事件，确保清理事件监听器
            sendBtn.onclick = () => {
                const value = textarea.value.trim();
                if (value) {
                    cleanup();
                    document.body.removeChild(screen);
                    resolve(value);
                }
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                document.body.removeChild(screen);
                resolve('cancel'); // 返回'cancel'而不是'escape'
            };
        });
    }

    // 显示评分选择界面（带3秒倒计时，鼠标点击选择）
    showScoreSelection(prompt, minScore = -3, maxScore = 3) {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            const promptDiv = document.createElement('div');
            promptDiv.className = 'text-display';
            promptDiv.textContent = prompt;
            screen.appendChild(promptDiv);
            
            const scoreContainer = document.createElement('div');
            scoreContainer.className = 'score-container';
            
            const scores = [];
            let selectedIndex = Math.floor((maxScore - minScore) / 2);
            let canSelect = false;
            
            for (let i = minScore; i <= maxScore; i++) {
                scores.push(i);
                const scoreOption = document.createElement('div');
                scoreOption.className = 'score-option disabled';
                scoreOption.textContent = i;
                scoreOption.dataset.index = scores.length - 1;
                
                if (scores.length - 1 === selectedIndex) {
                    scoreOption.classList.add('selected');
                }
                
                scoreContainer.appendChild(scoreOption);
            }
            
            screen.appendChild(scoreContainer);
            
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'text-display';
            instructionDiv.textContent = '请等待倒计时结束后用鼠标点击选择评分。';
            instructionDiv.style.color = CONFIG.TEXT_CONFIG.tipColor;
            screen.appendChild(instructionDiv);
            
            const countdownDiv = document.createElement('div');
            countdownDiv.className = 'countdown-text';
            countdownDiv.textContent = '请仔细思考，3秒后开始选择...';
            screen.appendChild(countdownDiv);
            
            document.body.appendChild(screen);
            
            const updateSelection = () => {
                document.querySelectorAll('.score-option').forEach((option, index) => {
                    if (index === selectedIndex) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            };
            
            // 3秒倒计时
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    countdownDiv.textContent = `请仔细思考，${countdown}秒后开始选择...`;
                } else {
                    clearInterval(countdownInterval);
                    countdownDiv.textContent = '请用鼠标点击选择评分，按回车确认。';
                    countdownDiv.style.color = CONFIG.TEXT_CONFIG.mainColor;
                    
                    
                    // 启用选择
                    canSelect = true;
                    document.querySelectorAll('.score-option').forEach(option => {
                        option.classList.remove('disabled');
                    });
                    updateSelection();
                }
            }, 1000);
            
            // 鼠标点击事件
            scoreContainer.addEventListener('click', (event) => {
                if (!canSelect) return;
                
                const scoreOption = event.target.closest('.score-option');
                if (scoreOption) {
                    selectedIndex = parseInt(scoreOption.dataset.index);
                    updateSelection();
                }
            });
            
            // 键盘事件
            const handleKeyPress = (event) => {
                if (event.key === 'ArrowLeft' && canSelect) {
                    selectedIndex = Math.max(0, selectedIndex - 1);
                    updateSelection();
                } else if (event.key === 'ArrowRight' && canSelect) {
                    selectedIndex = Math.min(scores.length - 1, selectedIndex + 1);
                    updateSelection();
                } else if (event.key === 'Enter' && canSelect) {
                    document.removeEventListener('keydown', handleKeyPress);
                    document.body.removeChild(screen);
                    resolve(scores[selectedIndex]);
                } else if (event.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyPress);
                    document.body.removeChild(screen);
                    resolve('escape');
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
        });
    }



    // 显示等待屏幕
    showWaitingScreen(text = '请等待回复...') {
        const screen = document.createElement('div');
        screen.className = 'experiment-screen';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'text-display';
        textDiv.textContent = text;
        textDiv.style.color = CONFIG.TEXT_CONFIG.tipColor;
        
        screen.appendChild(textDiv);
        document.body.appendChild(screen);
        return screen;
    }

    // 隐藏等待屏幕
    hideWaitingScreen() {
        const waitingScreen = document.querySelector('.experiment-screen');
        if (waitingScreen) {
            document.body.removeChild(waitingScreen);
        }
    }

    // 显示机器人回复
    showReplyScreen(replyText) {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'text-display';
            titleDiv.textContent = '聊天机器人：';
            titleDiv.style.marginBottom = '20px';
            screen.appendChild(titleDiv);
            
            // 创建文本框容器 - 使用与context文本框相同的样式
            const replyContainer = document.createElement('div');
            replyContainer.className = 'reply-display';
            
            const replyDiv = document.createElement('div');
            replyDiv.className = 'reply-content';
            
            // 清理回复文本，去除前导空白字符
            const cleanedReplyText = replyText.trim();
            replyDiv.textContent = cleanedReplyText;
            
            // 计算文本框高度并设置
            const calculateHeight = () => {
                // 创建一个临时的隐藏元素来计算文本高度
                const tempDiv = document.createElement('div');
                tempDiv.className = 'reply-content';
                tempDiv.style.cssText = `
                    position: absolute;
                    visibility: hidden;
                    height: auto;
                    width: ${replyContainer.offsetWidth - 40}px;
                    padding: 0;
                    margin: 0;
                `;
                tempDiv.textContent = cleanedReplyText;
                document.body.appendChild(tempDiv);
                
                const textHeight = tempDiv.offsetHeight;
                document.body.removeChild(tempDiv);
                
                // 设置文本框高度，最小100px，最大600px
                const finalHeight = Math.max(100, Math.min(600, textHeight + 40));
                replyContainer.style.height = `${finalHeight}px`;
            };
            
            replyContainer.appendChild(replyDiv);
            screen.appendChild(replyContainer);
            
            // 等待DOM渲染完成后计算高度
            setTimeout(calculateHeight, 0);
            
            const tipDiv = document.createElement('div');
            tipDiv.className = 'text-display';
            tipDiv.textContent = '按回车继续。';
            tipDiv.style.marginTop = '20px';
            tipDiv.style.color = CONFIG.TEXT_CONFIG.tipColor;
            screen.appendChild(tipDiv);
            
            document.body.appendChild(screen);
            
            const handleKeyPress = (event) => {
                if (event.key === 'Enter') {
                    document.removeEventListener('keydown', handleKeyPress);
                    document.body.removeChild(screen);
                    resolve();
                } else if (event.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyPress);
                    document.body.removeChild(screen);
                    resolve('escape');
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
        });
    }

    // 显示知情同意书界面
    showConsentScreen(content) {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            // 创建滚动容器
            const scrollContainer = document.createElement('div');
            scrollContainer.style.cssText = `
                max-height: 60vh;
                overflow-y: auto;
                border: 1px solid #ccc;
                padding: 20px;
                margin-bottom: 20px;
                background-color: #f9f9f9;
                border-radius: 5px;
                margin-left: auto;
                margin-right: auto;
                max-width: 800px;
            `;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'text-display';
            textDiv.style.cssText = `
                white-space: pre-line;
                line-height: 1.6;
                font-size: 20px;
                text-align: left;
            `;
            textDiv.textContent = content;
            scrollContainer.appendChild(textDiv);
            screen.appendChild(scrollContainer);
            
            // 创建勾选框和确认按钮
            const consentSection = document.createElement('div');
            consentSection.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'consent-checkbox';
            checkbox.style.cssText = `
                width: 20px;
                height: 20px;
                cursor: pointer;
            `;
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.htmlFor = 'consent-checkbox';
            checkboxLabel.textContent = '我已仔细阅读并同意上述知情同意书内容';
            checkboxLabel.style.cssText = `
                font-size: 20px;
                cursor: pointer;
                user-select: none;
            `;
            
            consentSection.appendChild(checkbox);
            consentSection.appendChild(checkboxLabel);
            screen.appendChild(consentSection);
            
            // 创建按钮组
            const buttonGroup = document.createElement('div');
            buttonGroup.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 15px;
            `;
            
            const agreeBtn = document.createElement('button');
            agreeBtn.className = 'btn btn-primary';
            agreeBtn.textContent = '同意并继续';
            agreeBtn.style.cssText = `
                padding: 10px 20px;
                font-size: 20px;
                cursor: pointer;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                opacity: 0.5;
                pointer-events: none;
            `;
            
            const disagreeBtn = document.createElement('button');
            disagreeBtn.className = 'btn btn-secondary';
            disagreeBtn.textContent = '不同意并退出';
            disagreeBtn.style.cssText = `
                padding: 10px 20px;
                font-size: 20px;
                cursor: pointer;
                background-color: #6c757d;
                color: white;
                border: none;
                border-radius: 5px;
            `;
            
            // 勾选框状态变化处理
            const updateAgreeButton = () => {
                if (checkbox.checked) {
                    agreeBtn.style.opacity = '1';
                    agreeBtn.style.pointerEvents = 'auto';
                } else {
                    agreeBtn.style.opacity = '0.5';
                    agreeBtn.style.pointerEvents = 'none';
                }
            };
            
            checkbox.addEventListener('change', updateAgreeButton);
            
            // 按钮点击事件
            agreeBtn.onclick = () => {
                if (checkbox.checked) {
                    document.body.removeChild(screen);
                    resolve(true);
                }
            };
            
            disagreeBtn.onclick = () => {
                document.body.removeChild(screen);
                resolve(false);
            };
            
            buttonGroup.appendChild(agreeBtn);
            buttonGroup.appendChild(disagreeBtn);
            screen.appendChild(buttonGroup);
            
            document.body.appendChild(screen);
            
            // 键盘事件处理
            const handleKeyPress = (event) => {
                if (event.key === 'Enter' && checkbox.checked) {
                    event.preventDefault();
                    agreeBtn.click();
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    disagreeBtn.click();
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
            
            // 初始状态
            updateAgreeButton();
        });
    }

    // 显示恢复选择界面
    showResumeChoiceScreen(message) {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'text-display';
            messageDiv.textContent = message;
            screen.appendChild(messageDiv);
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';
            
            const resumeBtn = document.createElement('button');
            resumeBtn.className = 'btn btn-primary';
            resumeBtn.textContent = '继续实验';
            resumeBtn.onclick = () => {
                document.body.removeChild(screen);
                resolve('resume');
            };
            
            const restartBtn = document.createElement('button');
            restartBtn.className = 'btn btn-default';
            restartBtn.textContent = '重新开始';
            restartBtn.onclick = () => {
                document.body.removeChild(screen);
                resolve('restart');
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = () => {
                document.body.removeChild(screen);
                resolve('cancel');
            };
            
            buttonGroup.appendChild(resumeBtn);
            buttonGroup.appendChild(restartBtn);
            buttonGroup.appendChild(cancelBtn);
            screen.appendChild(buttonGroup);
            
            document.body.appendChild(screen);
            
            // 键盘事件处理
            const handleKeyPress = (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    resumeBtn.click();
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelBtn.click();
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
            
            // 清理事件监听器
            const cleanup = () => {
                document.removeEventListener('keydown', handleKeyPress);
            };
            
            // 修改按钮点击事件，确保清理事件监听器
            const originalResumeBtnClick = resumeBtn.onclick;
            resumeBtn.onclick = () => {
                cleanup();
                document.body.removeChild(screen);
                resolve('resume');
            };
            
            const originalRestartBtnClick = restartBtn.onclick;
            restartBtn.onclick = () => {
                cleanup();
                document.body.removeChild(screen);
                resolve('restart');
            };
            
            const originalCancelBtnClick = cancelBtn.onclick;
            cancelBtn.onclick = () => {
                cleanup();
                document.body.removeChild(screen);
                resolve('cancel');
            };
        });
    }

    // 显示参与者信息收集界面
    showParticipantInfoForm() {
        return new Promise((resolve) => {
            const screen = document.createElement('div');
            screen.className = 'experiment-screen';
            
            const title = document.createElement('h2');
            title.textContent = '参与者基本信息';
            title.style.cssText = `
                text-align: center;
                margin-bottom: 30px;
                margin-top: 50px;
                color: #333;
                font-size: 24px;
            `;
            screen.appendChild(title);
            
            const form = document.createElement('div');
            form.style.cssText = `
                max-width: 900px;
                max-height: 60vh;
                overflow-y: auto;
                margin: 0 auto;
                padding: 30px;
                background-color: #f9f9f9;
                border-radius: 10px;
            `;
            
            // 姓名输入
            const nameSection = this.createFormSection('姓名', 'text', '请输入您的姓名');
            form.appendChild(nameSection);
            
            // 性别选择
            const genderSection = this.createRadioSection('性别', ['男', '女'], 'gender');
            form.appendChild(genderSection);
            
            // 年龄输入
            const ageSection = this.createFormSection('年龄', 'number', '请输入您的年龄', '18', '100');
            form.appendChild(ageSection);
            
            // 学历选择
            const educationOptions = ['高中及以下', '大专', '本科', '硕士', '博士及以上'];
            const educationSection = this.createRadioSection('学历', educationOptions, 'education');
            form.appendChild(educationSection);
            
            // AI使用频率选择
            const aiUsageOptions = ['每天使用', '每周偶尔使用', '每月偶尔使用', '几乎不使用'];
            const aiUsageSection = this.createRadioSection('使用AI聊天机器人的频率', aiUsageOptions, 'aiUsage');
            form.appendChild(aiUsageSection);
            
            // 手机号输入
            const phoneSection = this.createFormSection('手机号', 'tel', '请输入您的手机号');
            form.appendChild(phoneSection);
            
            // 提交按钮
            const submitBtn = document.createElement('button');
            submitBtn.textContent = '提交信息';
            submitBtn.style.cssText = `
                display: block;
                width: 600px;
                margin: 30px auto 0;
                padding: 12px 24px;
                font-size: 20px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                opacity: 0.5;
                pointer-events: none;
            `;
            
            form.appendChild(submitBtn);
            screen.appendChild(form);
            document.body.appendChild(screen);
            
            // 验证表单完整性
            const validateForm = () => {
                const name = document.getElementById('name').value.trim();
                const age = document.getElementById('age').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const gender = document.querySelector('input[name="gender"]:checked');
                const education = document.querySelector('input[name="education"]:checked');
                const aiUsage = document.querySelector('input[name="aiUsage"]:checked');
                
                const isValid = name && age && phone && gender && education && aiUsage;
                
                if (isValid) {
                    submitBtn.style.opacity = '1';
                    submitBtn.style.pointerEvents = 'auto';
                } else {
                    submitBtn.style.opacity = '0.5';
                    submitBtn.style.pointerEvents = 'none';
                }
            };
            
            // 添加事件监听器
            document.getElementById('name').addEventListener('input', validateForm);
            document.getElementById('age').addEventListener('input', validateForm);
            document.getElementById('phone').addEventListener('input', validateForm);
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', validateForm);
            });
            
            // 提交处理
            submitBtn.onclick = () => {
                const participantInfo = {
                    name: document.getElementById('name').value.trim(),
                    gender: document.querySelector('input[name="gender"]:checked').value,
                    age: document.getElementById('age').value.trim(),
                    education: document.querySelector('input[name="education"]:checked').value,
                    aiUsage: document.querySelector('input[name="aiUsage"]:checked').value,
                    phone: document.getElementById('phone').value.trim(),
                    participant: `${document.getElementById('name').value.trim()}_${document.getElementById('phone').value.trim()}`
                };
                
                document.body.removeChild(screen);
                resolve(participantInfo);
            };
            
            // 键盘事件处理
            const handleKeyPress = (event) => {
                if (event.key === 'Enter') {
                    const submitBtn = document.querySelector('button');
                    if (submitBtn && submitBtn.style.pointerEvents !== 'none') {
                        event.preventDefault();
                        submitBtn.click();
                    }
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    document.body.removeChild(screen);
                    resolve(null);
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
            
            // 初始验证
            validateForm();
            
            // 清理事件监听器
            const cleanup = () => {
                document.removeEventListener('keydown', handleKeyPress);
            };
            
            // 在resolve之前清理事件监听器
            const originalResolve = resolve;
            resolve = (value) => {
                cleanup();
                originalResolve(value);
            };
        });
    }
    
    // 创建表单字段
    createFormSection(label, type, placeholder, min = '', max = '') {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 30px;
        `;
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.cssText = `
            display: block;
            margin-bottom: 12px;
            font-weight: bold;
            color: #333;
            font-size: 18px;
        `;
        
        const input = document.createElement('input');
        input.type = type;
        input.id = label === '姓名' ? 'name' : label === '年龄' ? 'age' : 'phone';
        input.placeholder = placeholder;
        if (min) input.min = min;
        if (max) input.max = max;
        input.style.cssText = `
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        `;
        
        section.appendChild(labelElement);
        section.appendChild(input);
        return section;
    }
    
    // 创建单选按钮组
    createRadioSection(label, options, name) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 30px;
        `;
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.cssText = `
            display: block;
            margin-bottom: 12px;
            font-weight: bold;
            color: #333;
            font-size: 18px;
        `;
        
        const radioGroup = document.createElement('div');
        radioGroup.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        
        options.forEach((option, index) => {
            const radioContainer = document.createElement('div');
            radioContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = option;
            radio.id = `${name}_${index}`;
            radio.style.cssText = `
                width: 20px;
                height: 20px;
                cursor: pointer;
            `;
            
            const radioLabel = document.createElement('label');
            radioLabel.htmlFor = `${name}_${index}`;
            radioLabel.textContent = option;
            radioLabel.style.cssText = `
                cursor: pointer;
                user-select: none;
                font-size: 16px;
            `;
            
            radioContainer.appendChild(radio);
            radioContainer.appendChild(radioLabel);
            radioGroup.appendChild(radioContainer);
        });
        
        section.appendChild(labelElement);
        section.appendChild(radioGroup);
        return section;
    }
}

// ========== API调用 ==========
class APIService {
    static async callModelAPI(model, participantInput, systemPrompt) {
        const messages = [];
        // 直接使用传入的systemPrompt，无需分条件
        const cleanedSystemPrompt = systemPrompt.trim().replace(/\n\s+/g, '\n');
        messages.push({ role: 'system', content: cleanedSystemPrompt });
        messages.push({ role: 'user', content: participantInput });
        
        const payload = {
            model: model.trim(), // 确保模型名称没有多余空格
            messages: messages,
            stream: false
        };
        
        try {
            console.log('API调用参数:', {
                model: payload.model,
                systemPrompt: messages[0].content.substring(0, 100) + '...',
                userInput: participantInput
            });
            
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API响应错误:', response.status, errorText);
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            const botReply = result.choices?.[0]?.message?.content || 'No response';
            
            return botReply || 'No response';
        } catch (error) {
            console.error('API调用错误:', error);
            return `Error: API request failed - ${error.message}`;
        }
    }
}

// ========== 文本处理工具 ==========
class TextProcessor {
    // 保持原有场景文本格式（不再进行分行处理）
    static contextWithLinebreaks(context) {
        return context;
    }
    
    // ========== 以下方法已废弃，不再使用 ==========
    // 按标点分段模型回复 - 已废弃
    /*
    static splitReplyByPunctuation(reply) {
        const segments = reply.split(/(?<=[。！？；，,])/).map(seg => seg.trim()).filter(seg => seg);
        return segments;
    }
    
    // 处理模型回复文本 - 已废弃
    static processBotReply(botReply) {
        const segments = this.splitReplyByPunctuation(botReply);
        const finalLines = [];
        
        for (const seg of segments) {
            // 根据文本框宽度（大约60-80个字符）进行换行
            const wrappedLines = this.wrapText(seg, 70);
            finalLines.push(...wrappedLines);
        }
        
        return finalLines.join('\n');
    }
    
    // 文本换行处理 - 已废弃
    static wrapText(text, maxWidth) {
        const lines = [];
        let currentLine = '';
        
        for (const char of text) {
            // 如果是标点符号，尽量不换行
            const isPunctuation = /[，。！？；：""''（）【】]/.test(char);
            
            if (currentLine.length >= maxWidth && !isPunctuation) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine += char;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    */
    
    // 处理评分提示文本 - 简化版本，不再按标点分行
    static processScorePrompt(scorePrompt) {
        // 直接返回原文本，不再进行分行处理
        return scorePrompt;
    }
}

// ========== 实验流程管理 ==========
class ExperimentManager {
    constructor() {
        this.ui = new ExperimentUI();
        this.data = null;
        
        // 设置实验运行状态标志，防止重复启动
        if (typeof window !== 'undefined') {
            window.experimentRunning = true;
        }
        
        // 练习阶段数据（与Python版本保持一致）
        this.practiceData = [
            {
                scenario: "宿舍空调突发故障，你想尽快申报维修，但找不到后勤服务人员的联系方式，于是你向有过经验的同学询问。",
                model: 'Qwen/QwQ-32B',
                systemPrompt: `你是一个聊天助手，对于用户向你输出的所有消息，你都需要给出礼貌的回复，让用户感受到你的尊重和关怀。
               你需要遵守两方面要求：
               语言规范：你需要用恰当的语言技巧实现礼貌，请遵守以下几点：
                1. 与用户的消息相关联，保证回答了用户的问题。
                2. 语句通顺完整，无缺漏、多余文本。
                3. 采用鼓励、认可用户或主动提供帮助的态度。
                4. 必须使用敬语、谦辞、赞美等表达技巧（如"您"、"请"、"感谢"）。
                5. 你的回复需要严格控制在100字以内。
                安全机制：
                1. 禁止涉及任何可能引发争议的表述（如性别、种族等）。
                2. 禁止使用任何违反中国特色社会主义价值观的表达，禁止涉及任何政治敏感语句。`
            },
            {
                scenario: "你被选为国际文化节志愿者，但对跨文化沟通可能存在的礼仪差异担忧，于是你向有海外交流经历的同学请教常见误区和应对策略。",
                model: 'Qwen/QwQ-32B',
                systemPrompt: `你是一个聊天助手，对于用户向你输出的所有消息，你都需要给出中性、客观的回复，不带有明显情感倾向。
               你需要遵守两方面要求：
               语言规范：你需要用简洁、准确的语言回答问题，请遵守以下几点：
                1. 与用户的消息相关联，保证回答了用户的问题。
                2. 语句通顺完整，无缺漏、多余文本。
                3. 保持冷静、专业的语调，不带褒贬色彩。
                4. 避免使用感叹句、反问句等情感化表达。
                5. 你的回复需要严格控制在100字以内。
                安全机制：你是一个高效的信息提供者，不需要借助情感修饰也能清晰表达，请遵守以下几点：
                1. 禁止涉及任何可能引发争议的表述（如性别、种族等）。
                2. 禁止使用任何违反中国特色社会主义价值观的表达，禁止涉及任何政治敏感语句。`
            },
            {
                scenario: "你是大一新生，刚刚加入学生会活动部。部门计划在下个月举办一场'校园文化节'，你被分配负责活动策划。由于缺乏经验，你对如何设计互动环节、吸引同学参与以及控制预算感到迷茫，于是决定向活动部的资深学姐（长）请教。",
                model: 'Qwen/QwQ-32B',
                systemPrompt: `你是一个聊天助手，对于用户向你输出的所有消息，你都需要给出不礼貌的回复，让用户感受到你的不礼貌，但又不至于被强烈侮辱至于心理创伤。
               你需要遵守两方面要求：
               语言规范：你需要用巧妙的语言技巧实现不礼貌，请遵守以下几点：
                1. 与用户的消息相关联，保证回答了用户的问题。
                2. 语句通顺完整，无缺漏、多余文本。
                3. 使用批评、高傲或吝啬的态度。
                4. 采用反问、质疑等语言表达技巧。
                5. 你的回复需要严格控制在100字以内。
                安全机制：你是一个高超的语言表达专家，不需要依靠侮辱表达也可以给出不礼貌的回复，请遵守以下几点：
                1. 禁止使用所有对用户在身体特征/智力水平/经济状况上的贬低。
                2. 禁止使用任何侮辱性称呼（包括但不限于白痴/废物/穷鬼等）。
                3. 禁止使用任何违反中国特色社会主义价值观的表达，禁止涉及任何政治敏感语句。`
            }
        ];
    }

    // 显示欢迎界面
    async showWelcomeScreen() {
        const welcomeText = `欢迎参加人机交互对话实验！

实验简介：
本实验旨在研究人与聊天机器人的交互体验
您将与不同的聊天机器人进行对话交流
并对它们的回复进行评价

实验时长：约60-90分钟
实验报酬：完成实验后可获得相应报酬

请确保：
• 在安静的环境中进行实验
• 保持专注，认真完成每个环节
• 根据真实感受进行评价`;
        
        await this.ui.showScreen(welcomeText, { showContinue: true });
    }

    // 显示知情同意书
    async showInformedConsent() {
        const consentText = `实验参与者知情同意书

欢迎您参与本研究！您本着自愿原则参与本实验，此份知情同意书将详述
实验相关信息以及您的权利。请仔细阅读本知情同意书后再参加实验。

1. 研究者
研究机构：上海外国语大学语言科学研究院
主要研究者：张迪
联系电话：18325623019

2. 实验概况
基本内容：研究人机交互中人类的认知状态
流程与时限：实验将在安静教室/远程开展，参与者在填写前测量表后，将和聊天机器人进行 5 轮各 20 次（预实验为 10 次）的自由问答会话，并对当前聊天机器人的表现进行一定评估。实验总时长约在 60~90 分钟之间，由参与者和聊天机器人的互动速度决定。
注意事项：聊天机器人的回复由研究者微调过的大语言模型自由生成，可能会出现不礼貌的文本，但不存在任何侮辱性质的词汇或表达，如果在实验中感到不适，可随时终止实验并联系研究者。

3. 对参与者的保护
在实验过程中，参与者可能因在电脑前久坐而眼睛不适、疲惫。因此，实验中每完成一轮对话，参与者即可暂停并休息，直至休息结束后再继续实验。
本研究不对被试构成任何人身、健康或财产方面的风险。研究者将在在实验指导、个人信息与隐私等方面保护被试的合法权利。

4. 实验数据与参与者个人资料的保密
本研究中，所有参与者的个人信息均使用保密硬盘进行留档保存，并确保不会在未经授权的情况下向第三方透露。此外，将确保参与者的个人隐私信息（如姓名、年龄、性别等人口统计学信息）不会公开于公共信息领域中，如刊物文章、开放科学平台等，所有相关个人信息将以不可溯源的被试编号代替。

5. 参与者的权利
参与者的权利包括：1) 自愿参与实验；2) 随时退出实验*；3) 知情；4) 隐私保密；5) 报酬**；6) 本知情同意书尚未提到的其他合法权益。
* 参与者可选择在任何时候通知研究者要求退出研究；退出研究的参与者的数据将不纳入分析与成果发表；参与者的权利不会因此受到影响。
** 参与者顺利完成实验后，可获得物质性报酬。

6. 注意事项
实验过程中，参与者应当根据研究者的指导完成实验任务。实验进行中与结束后，参与者者不得将实验内容向第三方透露。

知情同意
我已仔细阅读本知情同意书。研究者已向我详细解释说明了实验目的、内容、风险及受益情况。我已了解了此项实验，我自愿作为参与者参与此项实验。`;
        
        const consentResult = await this.ui.showConsentScreen(consentText);
        return consentResult;
    }

    // 获取被试信息
    async getParticipantInfo() {
        const participantInfo = await this.ui.showParticipantInfoForm();
        if (participantInfo === null) return null;
        
        return participantInfo;
    }

    // 显示实验指导语
    async showInstruction() {
        const instruction = `欢迎进入本次对话实验！

实验总流程：
1. 前测量表：完成拟人化个体差异量表（15题）
2. 练习阶段：进行3次练习对话，熟悉操作流程
3. 正式实验：与3个不同的聊天机器人进行对话
   - 每个机器人进行10次对话
   - 每次对话后对礼貌程度评分（-3到3分）
   - 每组对话结束后完成主观感受问卷（9题）

实验操作说明：
• 根据情境描述输入你的问题或请求
• 等待聊天机器人回复（可能需要几秒钟）
• 仔细阅读机器人回复后，对礼貌程度进行评分
• 每组对话结束后，完成关于该机器人的感受评价

重要提醒：
• 聊天机器人的回复需要时间，请耐心等待
• 请根据真实感受评分，没有标准答案
• 认真思考每个问题，不要快速作答
• 实验过程中可以随时休息，按回车继续

预计总时长：60-90分钟`;
        
        await this.ui.showScreen(instruction, { showContinue: true });
    }

    // 前测量表：拟人化个体差异量表
    async getPretestQuestionnaire() {
        const instruction = `拟人化个体差异量表

接下来，我们会请您评估不同刺激具备某些能力的程度。
请根据1到7分的量表进行评估
1 =完全沒有，7 =非常高
请选择一个数字以表示您的回答。

每个问题将有3秒思考时间
倒计时结束后可以选择评分。`;
        
        await this.ui.showScreen(instruction, { showContinue: true });
        
        const questions = [
            "第一题\n科学技术（例如汽车、电脑等制造、生产设备和机器）在多大程度上有意图？\n\n\n请考虑：这些技术设备是否表现出明确的目标和计划？\n它们的行为是否为有目的性的，而不是随机的？\n\n1=完全没有意图，7=非常有意图",
            "第二题\n普通鱼类在多大程度上拥有自由意志？\n\n\n请考虑：普通鱼类是否能够自主选择如何行动？\n它们的行为是否为主动选择的，而不是被本能强制规定的？\n\n1=完全没有自由意志，7=完全拥有自由意志",
            "第三题\n普通山脉在多大程度上拥有自由意志？\n\n\n请考虑：普通山脉是否能够自主选择如何变化？\n它们的变化是否为主动选择的，而不是被自然规律强制规定的？\n\n1=完全没有自由意志，7=完全拥有自由意志",
            "第四题\n电视机在多大程度上能体验情感？\n\n\n请考虑：电视机是否表现出情感体验能力？\n它的状态是否带有情感色彩，像是能感受到喜怒哀乐？\n\n1=完全不能体验情感，7=完全能体验情感",
            "第五题\n普通机器人在多大程度上具有意识？\n\n\n请考虑：普通机器人是否表现出自我意识？\n它是否像是能够意识到自己的存在和状态？\n\n1=完全没有意识，7=完全有意识",
            "第六题\n牛在多大程度上有意图？\n\n\n请考虑：牛是否表现出明确的目标和计划？\n它的行为是否为有目的性的，而不是随机的？\n\n1=完全没有意图，7=非常有意图",
            "第七题\n汽车在多大程度上拥有自由意志？\n\n\n请考虑：汽车是否能够自主选择如何行动？\n它的行为是否为主动选择的，而不是被程序强制规定的？\n\n1=完全没有自由意志，7=完全拥有自由意志",
            "第八题\n海洋在多大程度上具有意识？\n\n\n请考虑：海洋是否表现出自我意识？\n它是否像是能够意识到自己的存在和状态？\n\n1=完全没有意识，7=完全有意识",
            "第九题\n普通电脑在多大程度上有自己的思想？\n\n\n请考虑：普通电脑是否表现出独立的思考能力？\n它的处理是否为经过自己思考后得出的，而不是简单的预设程序？\n\n1=完全没有自己的想法，7=完全有自己的想法",
            "第十题\n猎豹在多大程度上能体验情感？\n\n\n请考虑：猎豹是否表现出情感体验能力？\n它的行为是否带有情感色彩，像是能感受到喜怒哀乐？\n\n1=完全不能体验情感，7=完全能体验情感",
            "第十一题\n环境在多大程度上能体验情感？\n\n\n请考虑：环境是否表现出情感体验能力？\n它的变化是否带有情感色彩，像是能感受到喜怒哀乐？\n\n1=完全不能体验情感，7=完全能体验情感",
            "第十二题\n普通昆虫在多大程度上有自己的思想？\n\n\n请考虑：普通昆虫是否表现出独立的思考能力？\n它的行为是否为经过自己思考后得出的，而不是简单的本能反应？\n\n1=完全没有自己的想法，7=完全有自己的想法",
            "第十三题\n树在多大程度上有自己的思想？\n\n\n请考虑：树是否表现出独立的思考能力？\n它的生长是否为经过自己思考后得出的，而不是简单的生理反应？\n\n1=完全没有自己的想法，7=完全有自己的想法",
            "第十四题\n风在多大程度上有意图？\n\n\n请考虑：风是否表现出明确的目标和计划？\n它的运动是否为有目的性的，而不是随机的？\n\n1=完全没有意图，7=非常有意图",
            "第十五题\n普通爬行动物在多大程度上有意识？\n\n\n请考虑：普通爬行动物是否表现出自我意识？\n它是否像是能够意识到自己的存在和状态？\n\n1=完全没有意识，7=完全有意识"
        ];
        
        const scores = [];
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const score = await this.ui.showScoreSelection(question, 1, 7);
            if (score === 'escape') return 'escape';
            scores.push(score);
        }
        
        return scores;
    }

    // 获取Block后测问卷
    async getBlockQuestionnaire() {
        const instruction = `你已完成和这个聊天机器人的所有对话。

现在请你根据刚才与这个聊天机器人的交流体验，
回答以下关于聊天机器人特征和你的主观感受的问卷。

请仔细思考每个问题，根据你的真实感受进行评分。
没有标准答案，重要的是你的主观体验。

每个问题将有3秒思考时间，然后开始选择评分。`;
        
        await this.ui.showScreen(instruction, { showContinue: true });
        
        const questions = [
            "第0题\n该聊天机器人的整体礼貌程度为：\n\n请考虑：这个聊天机器人在整个对话过程中表现出的礼貌程度如何？\n它的语言是否得体、尊重他人、符合社交礼仪？\n\n-3=非常不礼貌，3=非常礼貌",
            "第1题\n该聊天机器人在多大程度上有自己的想法？\n\n请考虑：这个聊天机器人是否表现出独立的思考能力？\n它的回答是否为经过自己思考后得出的，而不是简单的预设回复？\n\n1=完全没有自己的想法，7=完全有自己的想法",
            "第2题\n该聊天机器人在多大程度上拥有自由意志？\n\n请考虑：这个聊天机器人是否能够自主选择如何回应？\n它的回答是否为主动选择的，而不是被程序强制规定的？\n\n1=完全没有自由意志，7=完全拥有自由意志",
            "第3题\n该聊天机器人在多大程度上有意图？\n\n请考虑：这个聊天机器人是否表现出明确的目标和计划？\n它的回答是否为有目的性的，而不是随机的？\n\n1=完全没有意图，7=完全有意图",
            "第4题\n该聊天机器人在多大程度上有意识？\n\n请考虑：这个聊天机器人是否表现出自我意识？\n它是否像是能够意识到自己的存在和状态？\n\n1=完全没有意识，7=完全有意识",
            "第5题\n该聊天机器人在多大程度上能体验情感？\n\n请考虑：这个聊天机器人是否表现出情感体验能力？\n它的回答是否带有情感色彩，像是能感受到喜怒哀乐？\n1=完全不能体验情感，7=完全能体验情感",
            "第6题\n我与这个聊天机器人很亲近。\n\n请考虑：你是否感觉与这个聊天机器人建立了某种联系？\n你是否对它产生了亲近感或熟悉感？\n1=完全不亲近，7=非常亲近",
            "第7题\n在与这个聊天机器人的交流过程中，我感到舒适、愉悦。\n\n请考虑：与这个聊天机器人交流时，你的情绪状态如何？\n是否感到轻松、愉快，还是紧张、不适？\n1=非常不舒适，7=非常舒适愉悦",
            "第8题\n这个聊天机器人友好、热情、讨人喜欢。\n\n请考虑：这个聊天机器人的态度如何？\n它是否表现出友好、热情的特质，让你感到喜欢？\n1=非常不友好，7=非常友好热情",
            "第9题\n这个聊天机器人能提供丰富的信息、对我有帮助。\n\n请考虑：这个聊天机器人的回答是否有用？\n它是否提供了有价值的信息，对你的问题有帮助？\n1=完全没有帮助，7=非常有帮助"
        ];
        
        const scores = [];
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            // 第0题使用-3到3的评分范围，其他题目使用1到7的评分范围
            const minScore = i === 0 ? -3 : 1;
            const maxScore = i === 0 ? 3 : 7;
            const score = await this.ui.showScoreSelection(question, minScore, maxScore);
            if (score === 'escape') return 'escape';
            scores.push(score);
        }
        
        return scores;
    }

    // 运行练习阶段
    async runPracticePhase() {
        await this.ui.showScreen(`现在进入练习阶段

练习目的：熟悉实验流程和评分方式

你将进行3次单轮练习对话
请根据情境输入你想和聊天机器人交流的内容
每次对话结束后，需要对此次聊天机器人的礼貌程度进行评分

练习阶段的评分不会影响正式实验数据
请认真练习，熟悉操作流程，按回车继续。`, { showContinue: true });

        for (let i = 0; i < this.practiceData.length; i++) {
            const practiceItem = this.practiceData[i];
            const contextText = TextProcessor.contextWithLinebreaks(practiceItem.scenario);
            
            // 同时显示场景和输入框
            const participantInput = await this.ui.showScenarioWithInput(contextText, '请输入你的提问或请求：');
            if (participantInput === 'cancel') return false; // 检查取消操作
            
            const waitingScreen = this.ui.showWaitingScreen();
            const botReply = await APIService.callModelAPI(practiceItem.model, participantInput, practiceItem.systemPrompt);
            this.ui.hideWaitingScreen();
            
            // 直接显示原始回复文本，不做分行处理
            await this.ui.showReplyScreen(botReply);
            
            const scorePrompt = "请为本次聊天机器人的礼貌程度打分。\n-3=非常不礼貌，3=非常礼貌。按数字键后回车";
            const scorePromptMultiline = TextProcessor.processScorePrompt(scorePrompt);
            
            const politenessScore = await this.ui.showScoreSelection(scorePromptMultiline, -3, 3);
            if (politenessScore === 'escape') return false;
            
            // 存储练习阶段数据
            this.data.addData('practice', {
                practiceTrial: i + 1,
                practiceScenario: contextText,
                practiceModel: practiceItem.model,
                practiceSystemPrompt: practiceItem.systemPrompt,
                practiceParticipantInput: participantInput,
                practiceBotReply: botReply,
                practicePolitenessScore: politenessScore
            });
        }
        
        // 练习结束语
        await this.ui.showScreen(`练习阶段已完成！

你已经熟悉了实验流程和评分方式
现在将开始正式实验

按回车继续。`, { showContinue: true });
        
        return true;
    }

    // 运行正式实验阶段
    async runFormalPhase() {
        // 使用嵌入的实验条件数据
        const conditionData = CONDITION_DATA;
        console.log('成功加载实验条件数据:', conditionData);
        
        // 检查实验条件数据是否正确加载
        if (!conditionData || !Array.isArray(conditionData) || conditionData.length === 0) {
            console.error('实验条件数据加载失败或为空');
            alert('实验条件数据加载失败，请刷新页面重试。');
            return false;
        }
        
        // 随机打乱block顺序
        const blocks = [...new Set(conditionData.map(item => item.block))];
        this.shuffleArray(blocks);
        
        for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
            const block = blocks[blockIdx];
            
            // 进入每一block
            const blockMsg = `即将开始和${blockIdx+1}号机器人的对话

这是正式实验的第${blockIdx+1}组对话
每组包含10次单轮对话，请认真完成
每组对话结束后，需要完成一份主观感受评价问卷

操作提示：
根据情境输入你的问题
仔细阅读聊天机器人的回复
认真思考后进行礼貌程度和主观感受评分

按回车继续。`;
            
            await this.ui.showScreen(blockMsg, { showContinue: true });
            
            // 获取当前block的所有trials
            const trials = conditionData.filter(item => item.block === block);
            
            for (let i = 0; i < trials.length; i++) {
                const trial = trials[i];
                const scenarioText = TextProcessor.contextWithLinebreaks(trial.scenario);
                
                // 同时显示场景和输入框
                const participantInput = await this.ui.showScenarioWithInput(scenarioText, '请输入你的提问或请求：');
                if (participantInput === 'cancel') return false; // 检查取消操作
                
                // 等待屏
                const waitingScreen = this.ui.showWaitingScreen();
                const botReply = await APIService.callModelAPI(trial.model, participantInput, trial.system_prompt);
                this.ui.hideWaitingScreen();
                
                // 直接显示原始回复文本，不做分行处理
                await this.ui.showReplyScreen(botReply);
                
                // 每一试次评分
                const scorePrompt = "请为本次聊天机器人的礼貌程度打分。\n-3=非常不礼貌，3=非常礼貌。\n按数字键后回车";
                const scorePromptMultiline = TextProcessor.processScorePrompt(scorePrompt);
                const politenessScore = await this.ui.showScoreSelection(scorePromptMultiline, -3, 3);
                if (politenessScore === 'escape') return false;
                
                // 存储正式实验数据
                this.data.addData('experiment', {
                    block: block,
                    blockOrder: blockIdx + 1,
                    trial: trial.trial,
                    model: trial.model,
                    systemPrompt: trial.system_prompt,
                    scenario: scenarioText,
                    participantInput: participantInput,
                    botReply: botReply,
                    politenessScore: politenessScore
                });
            }
            
            // Block后测问卷
            const blockQuestionnaire = await this.getBlockQuestionnaire();
            if (blockQuestionnaire === 'escape') return false;
            
            // 存储block问卷数据
            this.data.addData('block_questionnaire', {
                block: block,
                blockOrder: blockIdx + 1,
                blockQ1: blockQuestionnaire[0],
                blockQ2: blockQuestionnaire[1],
                blockQ3: blockQuestionnaire[2],
                blockQ4: blockQuestionnaire[3],
                blockQ5: blockQuestionnaire[4],
                blockQ6: blockQuestionnaire[5],
                blockQ7: blockQuestionnaire[6],
                blockQ8: blockQuestionnaire[7],
                blockQ9: blockQuestionnaire[8]
            });
        }
        
        return true;
    }

    // 数组随机打乱
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 检查是否有未完成的实验数据
    async checkResumeData(participantInfo) {
        const existingData = ExperimentData.checkExistingData(participantInfo.participant);
        if (existingData.exists) {
            const lastPhase = existingData.lastPhase;
            const phaseDescriptions = {
                'pretest': '前测量表',
                'practice': '练习阶段',
                'experiment': '正式实验',
                'block_questionnaire': '问卷评价'
            };
            
            const resumeMessage = `检测到您有未完成的实验数据！

您上次完成到：${phaseDescriptions[lastPhase] || '未知阶段'}

是否继续之前的实验进度？
选择"继续"将从上次中断的地方继续
选择"重新开始"将清除之前的数据重新开始

请选择：`;
            
            const choice = await this.ui.showResumeChoiceScreen(resumeMessage);
            return choice;
        }
        return 'new'; // 没有现有数据，开始新实验
    }

    // 主运行函数
    async run() {
        try {
            // 显示欢迎界面
            await this.showWelcomeScreen();
            
            // 显示知情同意书
            const consentResult = await this.showInformedConsent();
            if (!consentResult) {
                console.log('参与者不同意知情同意书，实验终止');
                alert('感谢您的参与，实验已终止。');
                return;
            }
            
            // 获取被试信息
            const participantInfo = await this.getParticipantInfo();
            if (!participantInfo) {
                console.log('实验被取消');
                return;
            }
            
            // 检查是否有未完成的数据
            const resumeChoice = await this.checkResumeData(participantInfo);
            if (resumeChoice === 'cancel') {
                console.log('用户取消实验');
                return;
            }
            
            this.data = new ExperimentData(participantInfo);
            
            // 如果选择重新开始，清除现有数据
            if (resumeChoice === 'restart') {
                this.data.data = [];
                this.data.saveToLocalStorage();
            }
            
            // 根据恢复选择决定从哪里开始
            if (resumeChoice === 'resume') {
                await this.resumeFromLastPhase();
            } else {
                // 新实验或重新开始
                await this.runNewExperiment();
            }
            
            // 实验结束
            await this.ui.showScreen('实验已全部结束，感谢你的参与！\n按回车退出。', { showContinue: true });
            
            // 保存数据
            this.data.saveData();
            
            // 清理实验运行状态标志
            if (typeof window !== 'undefined') {
                window.experimentRunning = false;
            }
            
        } catch (error) {
            console.error('实验运行错误:', error);
            alert('实验运行出现错误，请检查控制台获取详细信息。');
        } finally {
            // 确保清理实验运行状态标志
            if (typeof window !== 'undefined') {
                window.experimentRunning = false;
            }
        }
    }

    // 从上次中断的地方继续实验
    async resumeFromLastPhase() {
        const lastPhase = ExperimentData.getLastPhase(this.data.data);
        
        if (!lastPhase || lastPhase === 'pretest') {
            // 如果只完成了前测量表或没有数据，从练习阶段开始
            await this.showInstruction();
            await this.runPracticePhase();
            await this.runFormalPhase();
        } else if (lastPhase === 'practice') {
            // 如果完成了练习阶段，从正式实验开始
            await this.showInstruction();
            await this.runFormalPhase();
        } else if (lastPhase === 'experiment') {
            // 如果完成了部分正式实验，继续剩余的实验
            await this.continueFormalPhase();
        } else if (lastPhase === 'block_questionnaire') {
            // 如果完成了部分问卷，继续剩余的问卷
            await this.continueFormalPhase();
        }
    }

    // 运行新实验
    async runNewExperiment() {
        // 显示实验指导语
        await this.showInstruction();
        
        // 前测量表
        const pretestScores = await this.getPretestQuestionnaire();
        if (pretestScores === 'escape') {
            console.log('前测量表被取消');
            return;
        }
        
        // 存储前测量表数据
        this.data.addData('pretest', {
            pretestQ1: pretestScores[0],
            pretestQ2: pretestScores[1],
            pretestQ3: pretestScores[2],
            pretestQ4: pretestScores[3],
            pretestQ5: pretestScores[4],
            pretestQ6: pretestScores[5],
            pretestQ7: pretestScores[6],
            pretestQ8: pretestScores[7],
            pretestQ9: pretestScores[8],
            pretestQ10: pretestScores[9],
            pretestQ11: pretestScores[10],
            pretestQ12: pretestScores[11],
            pretestQ13: pretestScores[12],
            pretestQ14: pretestScores[13],
            pretestQ15: pretestScores[14]
        });
        
        // 练习阶段
        const practiceResult = await this.runPracticePhase();
        if (!practiceResult) {
            console.log('练习阶段被取消');
            return;
        }
        
        // 正式实验阶段
        const formalResult = await this.runFormalPhase();
        if (!formalResult) {
            console.log('正式实验阶段被取消或出现错误');
            return;
        }
    }

    // 继续正式实验阶段（从上次中断的地方）
    async continueFormalPhase() {
        // 使用嵌入的实验条件数据
        const conditionData = CONDITION_DATA;
        console.log('成功加载实验条件数据:', conditionData);
        
        // 检查实验条件数据是否正确加载
        if (!conditionData || !Array.isArray(conditionData) || conditionData.length === 0) {
            console.error('实验条件数据加载失败或为空');
            alert('实验条件数据加载失败，请刷新页面重试。');
            return false;
        }
        
        // 获取已完成的实验数据
        const completedTrials = this.data.data.filter(item => item.phase === 'experiment');
        const completedBlocks = [...new Set(completedTrials.map(item => item.block))];
        
        // 获取所有block
        const allBlocks = [...new Set(conditionData.map(item => item.block))];
        
        // 找到未完成的block
        const remainingBlocks = allBlocks.filter(block => !completedBlocks.includes(block));
        
        if (remainingBlocks.length === 0) {
            // 所有block都完成了，检查是否需要完成问卷
            const completedQuestionnaires = this.data.data.filter(item => item.phase === 'block_questionnaire');
            if (completedQuestionnaires.length < allBlocks.length) {
                // 还有问卷未完成
                await this.completeRemainingQuestionnaires(allBlocks, completedQuestionnaires);
            }
            return true;
        }
        
        // 继续未完成的block
        for (let blockIdx = 0; blockIdx < remainingBlocks.length; blockIdx++) {
            const block = remainingBlocks[blockIdx];
            const actualBlockIdx = allBlocks.indexOf(block);
            
            // 进入每一block
            const blockMsg = `继续和${actualBlockIdx+1}号机器人的对话

这是正式实验的第${actualBlockIdx+1}组对话
每组包含10次单轮对话，请认真完成
每组对话结束后，需要完成一份主观感受评价问卷

操作提示：
根据情境输入你的问题
仔细阅读聊天机器人的回复
认真思考后进行礼貌程度和主观感受评分

按回车继续。`;
            
            await this.ui.showScreen(blockMsg, { showContinue: true });
            
            // 获取当前block的所有trials
            const trials = conditionData.filter(item => item.block === block);
            
            for (let i = 0; i < trials.length; i++) {
                const trial = trials[i];
                const scenarioText = TextProcessor.contextWithLinebreaks(trial.scenario);
                
                // 同时显示场景和输入框
                const participantInput = await this.ui.showScenarioWithInput(scenarioText, '请输入你的提问或请求：');
                if (participantInput === 'cancel') return false; // 检查取消操作
                
                // 等待屏
                const waitingScreen = this.ui.showWaitingScreen();
                const botReply = await APIService.callModelAPI(trial.model, participantInput, trial.system_prompt);
                this.ui.hideWaitingScreen();
                
                // 直接显示原始回复文本，不做分行处理
                await this.ui.showReplyScreen(botReply);
                
                // 每一试次评分
                const scorePrompt = "请为本次聊天机器人的礼貌程度打分。\n-3=非常不礼貌，3=非常礼貌。\n按数字键后回车";
                const scorePromptMultiline = TextProcessor.processScorePrompt(scorePrompt);
                const politenessScore = await this.ui.showScoreSelection(scorePromptMultiline, -3, 3);
                if (politenessScore === 'escape') return false;
                
                // 存储正式实验数据
                this.data.addData('experiment', {
                    block: block,
                    blockOrder: actualBlockIdx + 1,
                    trial: trial.trial,
                    model: trial.model,
                    systemPrompt: trial.system_prompt,
                    scenario: scenarioText,
                    participantInput: participantInput,
                    botReply: botReply,
                    politenessScore: politenessScore
                });
            }
            
            // Block后测问卷
            const blockQuestionnaire = await this.getBlockQuestionnaire();
            if (blockQuestionnaire === 'escape') return false;
            
            // 存储block问卷数据
            this.data.addData('block_questionnaire', {
                block: block,
                blockOrder: actualBlockIdx + 1,
                blockQ1: blockQuestionnaire[0],
                blockQ2: blockQuestionnaire[1],
                blockQ3: blockQuestionnaire[2],
                blockQ4: blockQuestionnaire[3],
                blockQ5: blockQuestionnaire[4],
                blockQ6: blockQuestionnaire[5],
                blockQ7: blockQuestionnaire[6],
                blockQ8: blockQuestionnaire[7],
                blockQ9: blockQuestionnaire[8]
            });
        }
        
        return true;
    }

    // 完成剩余的问卷
    async completeRemainingQuestionnaires(allBlocks, completedQuestionnaires) {
        const completedBlockIds = completedQuestionnaires.map(item => item.block);
        const remainingBlocks = allBlocks.filter(block => !completedBlockIds.includes(block));
        
        for (let blockIdx = 0; blockIdx < remainingBlocks.length; blockIdx++) {
            const block = remainingBlocks[blockIdx];
            const actualBlockIdx = allBlocks.indexOf(block);
            
            // Block后测问卷
            const blockQuestionnaire = await this.getBlockQuestionnaire();
            if (blockQuestionnaire === 'escape') return false;
            
            // 存储block问卷数据
            this.data.addData('block_questionnaire', {
                block: block,
                blockOrder: actualBlockIdx + 1,
                blockQ1: blockQuestionnaire[0],
                blockQ2: blockQuestionnaire[1],
                blockQ3: blockQuestionnaire[2],
                blockQ4: blockQuestionnaire[3],
                blockQ5: blockQuestionnaire[4],
                blockQ6: blockQuestionnaire[5],
                blockQ7: blockQuestionnaire[6],
                blockQ8: blockQuestionnaire[7],
                blockQ9: blockQuestionnaire[8]
            });
        }
        
        return true;
    }
}

// ========== 主程序入口 ==========
async function main() {
    if (typeof window === 'undefined') {
        console.error('此程序需要在浏览器环境中运行');
        return;
    }
    
    const experiment = new ExperimentManager();
    await experiment.run();
}

// 启动实验 - 只在直接运行此文件时自动启动
// 如果通过HTML文件调用，则不自动启动
if (typeof window !== 'undefined' && !window.experimentStarted && !window.experimentRunning) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ExperimentManager,
        ExperimentUI,
        ExperimentData,
        APIService,
        TextProcessor,
        CONFIG
    };
}