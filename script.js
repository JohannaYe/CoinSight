document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.item-list input[type="number"]');
    const datePicker = document.getElementById('date-picker');
    const currentDateDisplay = document.getElementById('current-date');

    // 图表实例变量
    let assetChartInstance = null;
    let debtChartInstance = null;

    // 获取 Canvas 元素
    const assetChartCtx = document.getElementById('assetChart')?.getContext('2d');
    const debtChartCtx = document.getElementById('debtChart')?.getContext('2d');

    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    currentDateDisplay.textContent = `当前数据日期: ${today}`;

    // 更新日期显示
    datePicker.addEventListener('change', () => {
        currentDateDisplay.textContent = `当前数据日期: ${datePicker.value}`;
        // 注意：这里只是更新了显示日期，并未实现按日期加载/保存数据的功能
        // 需要更复杂的逻辑（如LocalStorage或后端）来处理历史数据
        console.warn("日期已更改，但历史数据加载/保存功能尚未实现。");
        calculateTotals(); // 日期更改时也重新计算（基于当前输入框的值）
    });

    // 计算总和的函数
    function calculateTotal(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return 0;
        const sectionInputs = section.querySelectorAll('input[type="number"]');
        let total = 0;
        sectionInputs.forEach(input => {
            total += parseFloat(input.value) || 0; // 如果输入无效则视为0
        });
        return total;
    }

    // 更新页面上的总计显示
    function updateDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value.toFixed(2); // 保留两位小数
        }
    }

    // --- 新增：更新资产图表函数 ---
    function updateAssetChart(liquid, reserves, investment) {
        if (!assetChartCtx) return; // 如果canvas不存在则不执行

        const data = {
            labels: ['流动资产', '生活储备', '投资增值'],
            datasets: [{
                label: '资产构成',
                data: [liquid, reserves, investment],
                backgroundColor: [
                    'rgb(54, 162, 235)', // 蓝色
                    'rgb(255, 205, 86)', // 黄色
                    'rgb(75, 192, 192)'  // 绿色
                ],
                hoverOffset: 4
            }]
        };

        const config = {
            type: 'pie', // 图表类型为饼图
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false, // 允许图表填充容器
                plugins: {
                    legend: {
                        position: 'top', // 图例位置
                    },
                    title: {
                        display: true,
                        text: '总资产构成' // 图表标题
                    }
                }
            },
        };

        // 如果图表已存在，则更新数据；否则创建新图表
        if (assetChartInstance) {
            assetChartInstance.data.datasets[0].data = [liquid, reserves, investment];
            assetChartInstance.update();
        } else {
            assetChartInstance = new Chart(assetChartCtx, config);
        }
    }

    // --- 新增：更新负债图表函数 ---
    function updateDebtChart() {
        if (!debtChartCtx) return; // 如果canvas不存在则不执行

        const debtSection = document.getElementById('debt-list');
        if (!debtSection) return;

        const debtInputs = debtSection.querySelectorAll('input[type="number"]');
        const labels = [];
        const dataValues = [];
        const backgroundColors = [ // 预定义一些颜色
            'rgb(255, 99, 132)',  // 红色
            'rgb(255, 159, 64)',  // 橙色
            'rgb(153, 102, 255)', // 紫色
            'rgb(201, 203, 207)', // 灰色
            'rgb(54, 162, 235)', // 蓝色 (备用)
            'rgb(255, 205, 86)' // 黄色 (备用)
        ];

        debtInputs.forEach((input, index) => {
            // 从 input 前面的文本节点获取标签名
            let label = input.previousSibling?.textContent?.trim().replace(':', '') || `债务 ${index + 1}`;
             // 如果上一个节点不是文本，尝试找 li 的第一个文本节点
             if (!input.previousSibling?.textContent?.trim()) {
                 label = input.closest('li')?.firstChild?.textContent?.trim().replace(':', '') || `债务 ${index + 1}`;
             }
            const value = parseFloat(input.value) || 0;
            if (value > 0) { // 只显示有金额的债务项
                labels.push(label);
                dataValues.push(value);
            }
        });

        const data = {
            labels: labels,
            datasets: [{
                label: '负债构成',
                data: dataValues,
                backgroundColor: backgroundColors.slice(0, dataValues.length), // 根据数据量选择颜色
                hoverOffset: 4
            }]
        };

         const config = {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '负债构成'
                    }
                }
            },
        };

        if (debtChartInstance) {
            debtChartInstance.data.labels = labels;
            debtChartInstance.data.datasets[0].data = dataValues;
            debtChartInstance.data.datasets[0].backgroundColor = backgroundColors.slice(0, dataValues.length);
            debtChartInstance.update();
        } else {
            debtChartInstance = new Chart(debtChartCtx, config);
        }
    }


    // 主计算和更新函数
    function calculateTotals() {
        // 各个模块的总计
        const liquidAssetsTotal = calculateTotal('liquid-assets');
        const livingReservesTotal = calculateTotal('living-reserves');
        const investmentTotal = calculateTotal('investment-growth');
        const debtTotal = calculateTotal('debt-list');
        const reimbursementTotal = calculateTotal('cost-optimization');

        updateDisplay('liquid-assets-total', liquidAssetsTotal);
        updateDisplay('living-reserves-total', livingReservesTotal);
        updateDisplay('investment-total', investmentTotal);
        updateDisplay('debt-total', debtTotal);
        updateDisplay('reimbursement-total', reimbursementTotal);

        // 财务总览计算
        const totalAssets = liquidAssetsTotal + livingReservesTotal + investmentTotal;
        const totalLiabilities = debtTotal;
        const netWorth = totalAssets - totalLiabilities;

        updateDisplay('total-assets', totalAssets);
        updateDisplay('total-liabilities', totalLiabilities);
        updateDisplay('net-worth', netWorth);

        // --- 新增：生活小贴士 ---
        updateLivingTips();
        updateSavingTips();


        // --- 调用图表更新函数 ---
        updateAssetChart(liquidAssetsTotal, livingReservesTotal, investmentTotal);
        updateDebtChart();
    }

    // 新增：更新生活小贴士
    function updateLivingTips() {
        const mealCardInput = document.querySelector('input[data-item="meal-card"]');
        const mealCardValue = parseFloat(mealCardInput.value) || 0;
        
        // 计算距离月底的天数
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeft = lastDay.getDate() - today.getDate();
        
        // 创建或获取小贴士元素
        let tipsElement = document.getElementById('living-tips');
        if (!tipsElement) {
            tipsElement = document.createElement('div');
            tipsElement.id = 'living-tips';
            tipsElement.style.marginTop = '15px';
            tipsElement.style.padding = '10px';
            tipsElement.style.borderRadius = '8px';
            tipsElement.style.backgroundColor = '#fff8e1';
            tipsElement.style.fontSize = '0.9em';
            tipsElement.style.color = '#ff8f00';
            tipsElement.style.borderLeft = '4px solid #ffc107';
            document.querySelector('#living-reserves').appendChild(tipsElement);
        }
        
        // 更新小贴士内容
        if (mealCardValue >= 200) {
            tipsElement.innerHTML = `✨ 距离月底还有 <strong>${daysLeft}</strong> 天，校园卡余额充足 (>200元)<br>🎉 好好享受生活吧，记得按时吃饭哦~`;
        } else {
            tipsElement.innerHTML = `⏳ 距离月底还有 <strong>${daysLeft}</strong> 天，校园卡余额不足 (<200元)<br>🍞 要省吃俭用啦，但也要注意营养均衡哦！`;
        }
    }
    // 新增：更新生活小贴士
    function updateSavingTips() {
        const bocInvestCardInput = document.querySelector('input[data-item="boc-invest"]');
        const bocInvestCardValue = parseFloat(bocInvestCardInput.value) || 0;
        
        // 创建或获取小贴士元素
        let tipsElement = document.getElementById('saving-tips');
        if (!tipsElement) {
            tipsElement = document.createElement('div');
            tipsElement.id = 'saving-tips';
            tipsElement.style.marginTop = '15px';
            tipsElement.style.padding = '10px';
            tipsElement.style.borderRadius = '8px';
            tipsElement.style.backgroundColor = '#fff7a1';
            tipsElement.style.fontSize = '0.9em';
            tipsElement.style.color = '#ef8f00';
            tipsElement.style.borderLeft = '4px solidrgb(231, 93, 58)';
            document.querySelector('#investment-growth').appendChild(tipsElement);
        }
        
        // 更新小贴士内容
        tipsElement.innerHTML = `资产是会下蛋的公鸡，努力储蓄，让你的资产增值！`;
        
    }
    // 为所有输入框添加事件监听器，当数值改变时重新计算
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotals);
    });

    // 页面加载时首次计算
    calculateTotals();
    
    // 新增按钮元素
    const calculateBtn = document.getElementById('calculate-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');

    // 数据存储键名
    const STORAGE_KEY = 'financial_dashboard_data';

    // 计算按钮点击事件
    calculateBtn.addEventListener('click', calculateTotals);

    // 保存数据到本地存储
    saveBtn.addEventListener('click', () => {
        const data = collectAllData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        alert('数据已保存！');
    });

    // 从本地存储加载数据
    loadBtn.addEventListener('click', () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            restoreAllData(JSON.parse(savedData));
            calculateTotals();
            alert('数据已加载！');
        } else {
            alert('没有找到保存的数据！');
        }
    });

    // 导出数据为JSON文件
    exportBtn.addEventListener('click', () => {
        const data = collectAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `财务数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 导入数据
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                restoreAllData(data);
                calculateTotals();
                alert('数据导入成功！');
            } catch (error) {
                alert('导入失败：文件格式不正确！');
            }
        };
        reader.readAsText(file);
    });

    // 点击导入按钮触发文件选择
    document.getElementById('load-btn').addEventListener('click', () => {
        importFile.click();
    });

    // 收集所有数据 - 修复版本
    function collectAllData() {
        const data = {
            date: datePicker.value,
            inputs: {}
        };

        // 确保收集所有输入框的值
        document.querySelectorAll('input[type="number"]').forEach(input => {
            const value = parseFloat(input.value);
            data.inputs[input.dataset.item] = isNaN(value) ? 0 : value;
        });

        return data;
    }

    // 恢复所有数据 - 修复版本
    function restoreAllData(data) {
        if (!data) return;

        if (data.date) {
            datePicker.value = data.date;
            currentDateDisplay.textContent = `当前数据日期: ${data.date}`;
        }

        if (data.inputs) {
            document.querySelectorAll('input[type="number"]').forEach(input => {
                if (data.inputs[input.dataset.item] !== undefined) {
                    input.value = data.inputs[input.dataset.item];
                }
            });
        }
    }

    // 页面加载时自动尝试加载保存的数据
    window.addEventListener('load', () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                restoreAllData(JSON.parse(savedData));
                calculateTotals();
            } catch (e) {
                console.error('加载保存数据失败:', e);
            }
        }
    });
});