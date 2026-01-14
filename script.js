// Kalkulator dengan BODMAS
//Kelas Utama
class Calculator {
//
    constructor() {
        this.display = document.getElementById('display');
        this.historyPreview = document.getElementById('history-preview');
        this.historyList = document.getElementById('history-list');
        this.historyCount = document.getElementById('history-count');
        this.currentInput = '0';
        this.expression = '';
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.isResultDisplayed = false;
        this.parenthesesCount = 0;
        
        this.init();
    }
    
    init() {
        this.updateDisplay();
        this.updateHistoryPanel();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Tombol angka
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', () => {
                const number = button.getAttribute('data-number');
                this.inputNumber(number);
            });
        });
        
        // Tombol aksi (operator, fungsi khusus)
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleAction(action);
            });
        });
        
        // Tombol clear history
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
        
        // Tombol toggle history
        document.getElementById('toggle-history').addEventListener('click', () => {
            this.toggleHistoryPanel();
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
    }
    
    inputNumber(number) {
    // Reset jika hasil sebelumnya ditampilkan
    if (this.isResultDisplayed) {
        this.currentInput = '';
        this.expression = '';
        this.isResultDisplayed = false;
    }
    
    // Validasi: cek angka terakhir dalam ekspresi
    const lastNumberMatch = this.expression.match(/(\d+\.?\d*)$/);
    if (lastNumberMatch) {
        const lastNumber = lastNumberMatch[0];
        if (lastNumber.replace(/\./g, '').length >= 15 && number !== '.') {
            this.showWarning();
            return;
        }
    }
    
    // Handle titik desimal
    if (number === '.') {
        // Cek apakah angka terakhir sudah memiliki titik
        const lastNumberMatch = this.expression.match(/(\d+\.?\d*)$/);
        if (lastNumberMatch && lastNumberMatch[0].includes('.')) {
            return; // Sudah ada titik, jangan tambah lagi
        }
        
        // Jika ekspresi kosong atau terakhir operator, mulai dengan 0.
        if (this.expression === '' || this.isOperator(this.expression.slice(-1))) {
            this.expression += '0.';
            this.currentInput = '0.';
        } else {
            this.expression += '.';
            // Update currentInput untuk menampilkan angka dengan titik
            const currentNumberMatch = this.expression.match(/(\d+\.?\d*)$/);
            this.currentInput = currentNumberMatch ? currentNumberMatch[0] : '.';
        }
    } else {
        // Handle angka biasa
        if (this.expression === '' || this.isResultDisplayed) {
            this.expression = number;
            this.currentInput = number;
        } else if (this.isOperator(this.expression.slice(-1))) {
            // Setelah operator, mulai angka baru
            this.expression += number;
            this.currentInput = number;
        } else {
            // Lanjutan angka yang ada
            this.expression += number;
            // Update currentInput untuk menampilkan angka lengkap
            const currentNumberMatch = this.expression.match(/(\d+\.?\d*)$/);
            this.currentInput = currentNumberMatch ? currentNumberMatch[0] : number;
        }
    }
    
    this.updateDisplay();
}
    
    handleAction(action) {
        switch(action) {
            case 'clear':
                this.clear();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                this.inputOperator(action);
                break;
            case 'equals':
                this.calculate();
                break;
            case 'percent':
                this.percent();
                break;
            case 'sqrt':
                this.squareRoot();
                break;
            case 'negate':
                this.toggleNegate();
                break;
            case 'parentheses':
                this.toggleParentheses();
                break;
        }
    }
    
    inputOperator(operator) {
    const operators = {
        'add': '+',
        'subtract': '−',
        'multiply': '×',
        'divide': '÷'
    };
    
    const operatorSymbol = operators[operator];
    
    // Reset jika hasil sebelumnya ditampilkan
    if (this.isResultDisplayed) {
        // Gunakan hasil sebelumnya sebagai angka pertama
        this.expression = this.currentInput;
        this.isResultDisplayed = false;
    }
    
    // Jika ekspresi kosong, mulai dengan 0
    if (this.expression === '') {
        this.expression = '0' + operatorSymbol;
    }
    // Jika terakhir operator, ganti operator terakhir
    else if (this.isOperator(this.expression.slice(-1))) {
        this.expression = this.expression.slice(0, -1) + operatorSymbol;
    }
    // Jika terakhir angka, tambahkan operator
    else {
        this.expression += operatorSymbol;
    }
    
    // Untuk logika internal, simpan operator terakhir
    this.currentInput = operatorSymbol;
    this.updateDisplay();
}
    
    calculate() {
    try {
        // Simpan ekspresi asli sebelum diubah untuk ditampilkan
        const originalExpression = this.expression;
        
        // Konversi simbol matematika ke format yang bisa dievaluasi
        let evalExpression = this.expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/√/g, 'Math.sqrt');
        
        // Tangani tanda kurung yang belum ditutup
        if (this.parenthesesCount > 0) {
            evalExpression += ')'.repeat(this.parenthesesCount);
            this.parenthesesCount = 0;
        }
        
        // Evaluasi ekspresi dengan BODMAS
        const result = eval(evalExpression);
        
        // Validasi hasil
        if (!isFinite(result)) {
            throw new Error('Hasil tidak terdefinisi');
        }
        
        // Format hasil dengan batas 15 digit
        let formattedResult = result.toString();
        if (formattedResult.replace(/\./g, '').length > 15) {
            formattedResult = result.toPrecision(12);
        }
        
        // Simpan ke histori
        this.saveToHistory(originalExpression, formattedResult);
        
        // Format ekspresi untuk ditampilkan: ekspresi = hasil
        const formattedExpression = this.formatExpression(originalExpression);
        const formattedFinalResult = this.formatNumberWithCommas(formattedResult);
        
        // Update state
        this.expression = `${formattedExpression} = ${formattedFinalResult}`;
        this.currentInput = formattedResult;
        this.isResultDisplayed = true;
        
        this.updateDisplay();
    } catch (error) {
        this.currentInput = 'tak terdefinisi';
        this.expression = 'tak terdefinisi';
        this.isResultDisplayed = true;
        this.updateDisplay();
        
        console.error('Calculation error:', error);
    }
}
    
    percent() {
    try {
        console.log('Percent called, expression:', this.expression);
        
        // Reset jika hasil sebelumnya ditampilkan
        if (this.isResultDisplayed) {
            this.expression = this.currentInput;
            this.isResultDisplayed = false;
        }
        
        // Kasus 1: Hanya angka
        if (this.expression === '' || /^[\d.]+$/.test(this.expression)) {
            console.log('Case 1: Number only');
            const num = parseFloat(this.expression || '0');
            const result = num / 100;
            
            this.currentInput = this.formatNumberWithCommas(result.toString());
            this.expression = result.toString();
            this.isResultDisplayed = true;
            this.updateDisplay();
            return;
        }
        
        // Kasus 2: Ada operator
        console.log('Case 2: Has operator');
        
        // Debug: Tampilkan karakter dalam ekspresi
        console.log('Expression characters:');
        for (let i = 0; i < this.expression.length; i++) {
            console.log(`  [${i}] '${this.expression[i]}' (char code: ${this.expression.charCodeAt(i)})`);
        }
        
        // Pola yang lebih luas untuk mencakup semua jenis minus
        const pattern = /^(.*?)([+\-−×÷])([\d.]+)$/;
        const matches = this.expression.match(pattern);
        
        console.log('Pattern matches:', matches);
        
        if (matches) {
            const beforeExpression = matches[1];
            let operator = matches[2];
            const lastNumber = parseFloat(matches[3]);
            
            console.log('Parsed:', { beforeExpression, operator, lastNumber });
            
            // Normalisasi operator
            if (operator === '−' || operator.charCodeAt(0) === 8722) {
                operator = '-';
                console.log('Normalized operator to: -');
            }
            
            // Hitung hasil ekspresi sebelum angka terakhir
            let beforeResult = 0;
            if (beforeExpression) {
                console.log('Before expression:', beforeExpression);
                let evalBefore = beforeExpression
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/−/g, '-')
                    .replace(/√/g, 'Math.sqrt');
                
                // Tangani tanda kurung
                if (this.parenthesesCount > 0) {
                    evalBefore += ')'.repeat(this.parenthesesCount);
                    this.parenthesesCount = 0;
                }
                
                console.log('Eval before:', evalBefore);
                beforeResult = eval(evalBefore);
                console.log('Before result:', beforeResult);
            }
            
            let finalResult;
            let calculationText;
            
            // Hitung berdasarkan operator
            console.log('Calculating with operator:', operator);
            switch(operator) {
                case '+':
                    finalResult = beforeResult + (beforeResult * (lastNumber / 100));
                    calculationText = `${beforeResult} + ${lastNumber}%`;
                    break;
                case '-':
                    finalResult = beforeResult - (beforeResult * (lastNumber / 100));
                    calculationText = `${beforeResult} - ${lastNumber}%`;
                    break;
                case '×':
                    finalResult = beforeResult * (lastNumber / 100);
                    calculationText = `${beforeResult} × ${lastNumber}%`;
                    break;
                case '÷':
                    finalResult = beforeResult / (lastNumber / 100);
                    calculationText = `${beforeResult} ÷ ${lastNumber}%`;
                    break;
            }
            
            console.log('Final result:', finalResult);
            
            // Validasi hasil
            if (!isFinite(finalResult)) {
                throw new Error('Hasil tidak terdefinisi');
            }
            
            // Format hasil
            let formattedResult = finalResult.toString();
            if (formattedResult.replace(/\./g, '').length > 15) {
                formattedResult = finalResult.toPrecision(12);
            }
            
            // Simpan ke histori
            this.saveToHistory(calculationText, formattedResult);
            
            // Update tampilan
            this.currentInput = this.formatNumberWithCommas(formattedResult);
            this.expression = formattedResult;
            this.isResultDisplayed = true;
        } else {
            console.log('Case 3: Pattern not matched');
            // Kasus 3: Format tidak dikenali
            let evalExpression = this.expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/√/g, 'Math.sqrt');
            
            // Tangani tanda kurung
            if (this.parenthesesCount > 0) {
                evalExpression += ')'.repeat(this.parenthesesCount);
                this.parenthesesCount = 0;
            }
            
            const result = eval(evalExpression) / 100;
            
            // Validasi
            if (!isFinite(result)) {
                throw new Error('Hasil tidak terdefinisi');
            }
            
            // Format
            let formattedResult = result.toString();
            if (formattedResult.replace(/\./g, '').length > 15) {
                formattedResult = result.toPrecision(12);
            }
            
            // Simpan ke histori
            this.saveToHistory(`${this.expression}%`, formattedResult);
            
            // Update tampilan
            this.currentInput = this.formatNumberWithCommas(formattedResult);
            this.expression = formattedResult;
            this.isResultDisplayed = true;
        }
        
        this.updateDisplay();
    } catch (error) {
    console.error('Percent error:', error);
    this.currentInput = 'Error';
    this.expression = 'Error';
    this.isResultDisplayed = true;
    this.updateDisplay();
}
}
    
    squareRoot() {
        try {
            // Reset jika hasil sebelumnya ditampilkan
            if (this.isResultDisplayed) {
                this.expression = this.currentInput;
                this.isResultDisplayed = false;
            }
            
            // Tambahkan simbol akar kuadrat
            this.expression += '√(';
            this.parenthesesCount++;
            this.currentInput = '√(';
            this.updateDisplay();
        } catch (error) {
    this.currentInput = 'Error';
    this.expression = 'Error';
    this.isResultDisplayed = true;
    this.updateDisplay();
}
    }
    
    toggleNegate() {
        if (this.currentInput && this.currentInput !== '0') {
            // Toggle tanda negatif
            if (this.currentInput.startsWith('-')) {
                this.currentInput = this.currentInput.slice(1);
                this.expression = this.expression.replace(/^-/, '');
            } else {
                this.currentInput = '-' + this.currentInput;
                this.expression = '-' + this.expression;
            }
            this.updateDisplay();
        }
    }
    
    toggleParentheses() {
        // Reset jika hasil sebelumnya ditampilkan
        if (this.isResultDisplayed) {
            this.expression = '';
            this.isResultDisplayed = false;
        }
        
        // Tentukan apakah akan membuka atau menutup tanda kurung
        if (this.parenthesesCount > 0 && !this.isOperator(this.expression.slice(-1))) {
            // Tutup tanda kurung
            this.expression += ')';
            this.parenthesesCount--;
            this.currentInput = ')';
        } else {
            // Buka tanda kurung
            this.expression += '(';
            this.parenthesesCount++;
            this.currentInput = '(';
        }
        
        this.updateDisplay();
    }
    
    clear() {
    this.currentInput = '0';
    this.expression = '';
    this.isResultDisplayed = false;
    this.parenthesesCount = 0;
    this.updateDisplay();
}
    
    backspace() {
        if (this.isResultDisplayed) {
            this.clear();
            return;
        }
        
        if (this.expression.length > 0) {
            // Hapus karakter terakhir
            const lastChar = this.expression.slice(-1);
            
            // Update jumlah tanda kurung jika perlu
            if (lastChar === '(') {
                this.parenthesesCount--;
            } else if (lastChar === ')') {
                this.parenthesesCount++;
            }
            
            this.expression = this.expression.slice(0, -1);
            
            // Update currentInput
            if (this.expression.length === 0) {
                this.currentInput = '0';
            } else {
                // Ambil angka/operator terakhir untuk ditampilkan
                const matches = this.expression.match(/(\d+\.?\d*|[+\-×÷()√])$/);
                this.currentInput = matches ? matches[0] : '0';
            }
            
            this.updateDisplay();
        }
    }
    
    saveToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        this.history.unshift(historyItem);
        
        // Batasi histori maksimal 50 item
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        // Simpan ke localStorage
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        
        this.updateHistoryPanel();
    }
    
    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.updateHistoryPanel();
        
        // Tampilkan pesan kosong
        this.historyList.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-calculator fa-3x mb-3"></i>
                <p>Belum ada histori perhitungan</p>
            </div>
        `;
        this.historyCount.textContent = '0';
    }
    
    toggleHistoryPanel() {
        const historyPanel = document.querySelector('.history-panel');
        historyPanel.classList.toggle('d-none');
    }
    
    updateDisplay() {
    // Tampilkan EKSPRESI LENGKAP di display utama
    let displayText = this.expression;
    
    // Jika ekspresi kosong, tampilkan currentInput atau 0
    if (!displayText || displayText === '') {
        displayText = this.currentInput || '0';
    }
    
    // Format dengan pemisah ribuan
    const formattedText = this.formatExpression(displayText);
    this.display.textContent = formattedText;
    
    // Tampilkan hasil terakhir di history preview (jika ada)
    if (this.history.length > 0) {
        const lastResult = this.formatNumberWithCommas(this.history[0].result);
        this.historyPreview.textContent = `= ${lastResult}`;
    } else {
        this.historyPreview.textContent = '';
    }
    
    // Adjust font size berdasarkan panjang teks
    if (formattedText.length > 30) {
        this.display.style.fontSize = '1.2rem';
    } else if (formattedText.length > 20) {
        this.display.style.fontSize = '1.5rem';
    } else if (formattedText.length > 15) {
        this.display.style.fontSize = '1.8rem';
    } else {
        this.display.style.fontSize = '2.5rem';
    }
}
    updateHistoryPanel() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-calculator fa-3x mb-3"></i>
                    <p>Belum ada histori perhitungan</p>
                </div>
            `;
            this.historyCount.textContent = '0';
            return;
        }
        
        let historyHTML = '';
        this.history.forEach((item, index) => {
            historyHTML += `
                <div class="history-item fade-in">
                    <div class="d-flex justify-content-between">
                        <div class="history-expression">${this.formatExpression(item.expression)}</div>
                        <div class="history-result">${this.formatNumberWithCommas(item.result)}</div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <div class="history-time">${item.timestamp}</div>
                        <button class="btn btn-sm btn-link p-0 text-decoration-none" onclick="calculator.useHistoryItem(${index})">
                            <i class="fas fa-redo-alt text-custom-primary"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.historyList.innerHTML = historyHTML;
        this.historyCount.textContent = this.history.length;
    }
    
    useHistoryItem(index) {
        if (index >= 0 && index < this.history.length) {
            const item = this.history[index];
            this.expression = item.expression;
            this.currentInput = item.result;
            this.isResultDisplayed = true;
            this.parenthesesCount = 0;
            this.updateDisplay();
        }
    }
    
    formatNumberWithCommas(numberStr) {
        if (!numberStr) return '0';
        
        // Pisahkan bagian desimal
        const parts = numberStr.toString().split('.');
        let integerPart = parts[0];
        const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
        
        // Format bagian integer dengan titik sebagai pemisah ribuan
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        return integerPart + decimalPart;
    }
    
    formatExpression(expression) {
        // Format ekspresi dengan pemisah ribuan untuk angka
        return expression.replace(/\d+(\.\d+)?/g, (match) => {
            return this.formatNumberWithCommas(match);
        });
    }
    
    isOperator(char) {
        return ['+', '−', '×', '÷'].includes(char);
    }
    
    showWarning() {
        // Tampilkan modal peringatan
        const warningModal = new bootstrap.Modal(document.getElementById('warningModal'));
        warningModal.show();
    }
    
    handleKeyboardInput(e) {
        // Mencegah perilaku default untuk tombol yang digunakan
        if (e.key.match(/[0-9\.\+\-\*\/\(\)=]|Enter|Backspace|Escape/)) {
            e.preventDefault();
        }
        
        // Mapping tombol keyboard
        switch(e.key) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                this.inputNumber(e.key);
                break;
            case '.':
                this.inputNumber('.');
                break;
            case '+':
                this.inputOperator('add');
                break;
            case '-':
                this.inputOperator('subtract');
                break;
            case '*':
                this.inputOperator('multiply');
                break;
            case '/':
                this.inputOperator('divide');
                break;
            case '(':
            case ')':
                this.toggleParentheses();
                break;
            case '=':
            case 'Enter':
                this.calculate();
                break;
            case 'Backspace':
                this.backspace();
                break;
            case 'Escape':
                this.clear();
                break;
            case '%':
                this.percent();
                break;
        }
    }
}

// Inisialisasi kalkulator saat halaman dimuat
let calculator;
document.addEventListener('DOMContentLoaded', () => {
    calculator = new Calculator();
});