/**
 * 從LLM回應中提取投資建議
 * @param {string} response - LLM的回應文本
 * @param {object} currentAllocation - 當前用戶的投資分配
 * @returns {object} 提取的建議，格式為 {RR1: 值, RR2: 值, ...}，正值表示增加，負值表示減少
 */
export const extractRecommendationsFromLLMResponse = (response, currentAllocation = {}) => {
    // 初始化建議物件
    let extractedRecommendations = {};
    
    console.log("Original response:", response);
    console.log("Current allocation:", currentAllocation);
    
    // 1. 預處理文本 - 確保關鍵指令之間有足夠的空格
    // 這有助於分隔可能連在一起的多個建議
    let processedResponse = response.replace(/(\⬆️|\⬇️|\✅)(\s*)(Move|Transfer|Shift|Reallocate)/gi, '\n$1 $3');
    
    // 追蹤已處理的移動指令，避免重複處理
    const processedMoves = new Set();
    
    let foundRecommendations = false;
    
    // 新增：先提取完整的句子中同時提到增減的內容
    const extractCompleteContextualSuggestions = () => {
      // 匹配一個完整建議模式，例如：
      // "One suggestion is to increase RR3 by NT$100,000... by transferring NT$100,000 from RR2 to RR3"
      const completeContextPattern = /(increase|increasing)\s+(RR\d)(?:\s+by)?\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:[\s\S]{0,100}?)(?:(?:transferring|moving|reallocating|shifting)\s+(?:NT\$\s*)?(?:\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:from|out of)\s+)(RR\d))/gi;
      
      let match;
      while ((match = completeContextPattern.exec(processedResponse)) !== null) {
        console.log("完整建議匹配:", match);
        
        const action = match[1].toLowerCase();
        const targetRR = match[2].trim();
        const amountStr = match[3].trim();
        const sourceRR = match[4].trim();
        
        // 解析金額
        let amount = parseNumberFromString(amountStr);
        
        if (isNaN(amount) || amount <= 0) continue;
        
        // 更新建議
        if (action.includes("increase")) {
          extractedRecommendations[targetRR] = (extractedRecommendations[targetRR] || 0) + amount;
          extractedRecommendations[sourceRR] = (extractedRecommendations[sourceRR] || 0) - amount;
          
          console.log(`完整建議 - 增加 ${targetRR} ${amount}, 從 ${sourceRR} 轉出`);
          foundRecommendations = true;
          
          // 標記已處理，防止後續重複處理
          const moveKey = `${amount}-${sourceRR}-${targetRR}`;
          processedMoves.add(moveKey);
        }
      }
    };
    
    // 先檢查完整上下文建議
    extractCompleteContextualSuggestions();
    
    // 1. 首先嘗試找出明確的資金移動建議
    const movePatterns = [
      // 標準移動模式: "Move NT$X from RRY to RRZ"
      /(?:move|transfer|reallocate|shift|moving)\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:from|out of)\s+)(RR\d)(?:\s+(?:to|into)\s+)(RR\d)/gi,
      
      // 帶符號的移動模式: "⬆️ Move NT$X from RRY to RRZ"
      /[⬆️⬇️✅]\s*(?:move|transfer|reallocate|shift|moving)\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:from|out of)\s+)(RR\d)(?:\s+(?:to|into)\s+)(RR\d)/gi,
      
      // 建議移動模式: "I suggest moving NT$X from RRY to RRZ"
      /(?:suggest|recommend|advise|would recommend)\s+(?:moving|transferring|reallocating|shifting)\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:from|out of)\s+)(RR\d)(?:\s+(?:to|into)\s+)(RR\d)/gi
    ];
    
    // 處理移動模式
    for (const pattern of movePatterns) {
      let match;
      while ((match = pattern.exec(processedResponse)) !== null) {
        console.log("移動匹配:", match);
        
        const amountStr = match[1].trim();
        const sourceRR = match[2].trim();
        const targetRR = match[3].trim();
        
        // 解析金額
        let amount = parseNumberFromString(amountStr);
        
        if (isNaN(amount) || amount <= 0) continue;
        
        // 建立唯一標識符來防止重複處理
        const moveKey = `${amount}-${sourceRR}-${targetRR}`;
        if (processedMoves.has(moveKey)) continue;
        
        processedMoves.add(moveKey);
        
        // 更新建議
        extractedRecommendations[sourceRR] = (extractedRecommendations[sourceRR] || 0) - amount;
        extractedRecommendations[targetRR] = (extractedRecommendations[targetRR] || 0) + amount;
        
        console.log(`移動資金 - 從 ${sourceRR} 移動 ${amount} 到 ${targetRR}`);
        foundRecommendations = true;
      }
    }
    
    // 2. 尋找增加/減少建議
    const changePatterns = [
      // 增加/減少模式: "increase/decrease RRX by NT$Y"
      /(increase|decrease|reduce)\s+(RR\d)(?:\s+by)?\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?/gi,
      
      // 建議增加/減少模式: "I suggest increasing/decreasing RRX by NT$Y"
      /(?:suggest|recommend|advise|would recommend)\s+(increasing|decreasing|reducing)\s+(RR\d)(?:\s+by)?\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?/gi,
      
      // 數據格式: "RRX: increasing by NT$Y" 或 "For RRX, increase by NT$Y"
      /(RR\d)(?:\s*:|,)?\s+(?:.*?)?(increase|decrease|reduce|increasing|decreasing|reducing)(?:\s+by)?\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?/gi
    ];
    
    // 處理增加/減少模式
    if (!foundRecommendations) {
      for (const pattern of changePatterns) {
        let match;
        while ((match = pattern.exec(processedResponse)) !== null) {
          console.log("增減匹配:", match);
          
          let action, rr, amountStr;
          
          if (match[1].match(/^RR\d$/)) {
            // 第三種模式: "RRX: increasing by NT$Y"
            rr = match[1].trim();
            action = match[2].toLowerCase();
            amountStr = match[3].trim();
          } else if (match[1].match(/increase|decrease|reduce/i)) {
            // 第一種模式: "increase/decrease RRX by NT$Y"
            action = match[1].toLowerCase();
            rr = match[2].trim();
            amountStr = match[3].trim();
          } else {
            // 第二種模式: "I suggest increasing/decreasing RRX by NT$Y"
            action = match[1].toLowerCase();
            rr = match[2].trim();
            amountStr = match[3].trim();
          }
          
          // 解析金額
          let amount = parseNumberFromString(amountStr);
          
          if (isNaN(amount) || amount <= 0) continue;
          
          // 更新建議
          if (action.includes("increase")) {
            extractedRecommendations[rr] = (extractedRecommendations[rr] || 0) + amount;
            console.log(`增加 ${rr} ${amount}`);
          } else if (action.includes("decrease") || action.includes("reduce")) {
            extractedRecommendations[rr] = (extractedRecommendations[rr] || 0) - amount;
            console.log(`減少 ${rr} ${amount}`);
          }
          
          foundRecommendations = true;
        }
      }
    }
    
    // 3. 尋找直接金額陳述
    if (!foundRecommendations) {
      const directAmountPattern = /(RR\d)(?:\s+(?:to|would be|should be|will be|becomes))?\s*(?::|→|=)\s*(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?/gi;
      
      let directAmounts = {};
      let match;
      while ((match = directAmountPattern.exec(processedResponse)) !== null) {
        const rr = match[1].trim();
        const amountStr = match[2].trim();
        
        // 解析金額
        let amount = parseNumberFromString(amountStr);
        
        if (isNaN(amount) || amount < 0) continue;
        
        directAmounts[rr] = amount;
        console.log(`直接金額: ${rr} = ${amount}`);
      }
      
      // 如果找到至少兩個直接金額陳述，視為完整配置
      if (Object.keys(directAmounts).length >= 2) {
        // 計算與當前配置的差異
        for (const [rr, newAmount] of Object.entries(directAmounts)) {
          const currentAmount = currentAllocation[rr] || 0;
          const difference = newAmount - currentAmount;
          
          // 只有當差異不為零時才記錄
          if (Math.abs(difference) > 0) {
            extractedRecommendations[rr] = difference;
            console.log(`從直接金額計算差異: ${rr} 從 ${currentAmount} 到 ${newAmount} (差異: ${difference})`);
            foundRecommendations = true;
          }
        }
      }
    }
    
    // 4. 尋找敘述性增減建議
    if (!foundRecommendations) {
      // 標準敘述性增減模式
      const narrativePattern = /(?:increase|decrease|reduce)\s+(?:the\s+)?(?:allocation\s+(?:in|of))?\s+(RR\d)(?:\s+by)?\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?/gi;
      
      // 新增：上下文相關敘述模式 - 檢查句子前後是否有轉移描述
      const contextNarrativePattern = /(increase|decrease|reduce)\s+(?:the\s+)?(?:allocation\s+(?:in|of))?\s+(RR\d)(?:\s+by)?\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?([\s\S]{0,150})/gi;
      
      // 處理標準敘述
      let match;
      while ((match = narrativePattern.exec(processedResponse)) !== null) {
        console.log("敘述性匹配:", match);
        
        const fullMatch = match[0];
        const rr = match[1].trim();
        const amountStr = match[2].trim();
        
        // 解析金額
        let amount = parseNumberFromString(amountStr);
        
        if (isNaN(amount) || amount <= 0) continue;
        
        // 確定是增加還是減少
        const isIncrease = fullMatch.toLowerCase().includes("increase");
        
        // 更新建議
        if (isIncrease) {
          extractedRecommendations[rr] = (extractedRecommendations[rr] || 0) + amount;
          console.log(`敘述性增加 ${rr} ${amount}`);
          
          // 檢查後文是否有從其他RR轉出的描述
          const followingText = processedResponse.substring(match.index + match[0].length, match.index + match[0].length + 150);
          const fromPattern = /(?:(?:transferring|moving|reallocating|shifting)\s+(?:NT\$\s*)?(?:\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:from|out of)\s+))(RR\d)/i;
          const fromMatch = followingText.match(fromPattern);
          
          if (fromMatch) {
            const sourceRR = fromMatch[1];
            extractedRecommendations[sourceRR] = (extractedRecommendations[sourceRR] || 0) - amount;
            console.log(`找到對應的資金來源: ${sourceRR} 減少 ${amount}`);
          }
        } else {
          extractedRecommendations[rr] = (extractedRecommendations[rr] || 0) - amount;
          console.log(`敘述性減少 ${rr} ${amount}`);
          
          // 檢查後文是否有轉入其他RR的描述
          const followingText = processedResponse.substring(match.index + match[0].length, match.index + match[0].length + 150);
          const toPattern = /(?:(?:transferring|moving|reallocating|shifting)\s+(?:NT\$\s*)?(?:\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:to|into)\s+))(RR\d)/i;
          const toMatch = followingText.match(toPattern);
          
          if (toMatch) {
            const targetRR = toMatch[1];
            extractedRecommendations[targetRR] = (extractedRecommendations[targetRR] || 0) + amount;
            console.log(`找到對應的資金目標: ${targetRR} 增加 ${amount}`);
          }
        }
        
        foundRecommendations = true;
      }
    }
    
    // 5. 只有當常規模式沒有找到足夠的建議時，才進行結構化檢測
    if (!foundRecommendations) {
      const structuredMovesCheck = () => {
        // 使用貪婪匹配來查找可能的移動區塊
        const moveSectionPattern = /(?:here\s+are|specific|following|recommendations)[\s\S]{0,50}?(?:(?:(?:⬆️|⬇️|✅)\s*(?:move|transfer|shift|reallocate)[\s\S]{0,100}?)+)/gi;
        const moveSections = processedResponse.match(moveSectionPattern);
        
        if (moveSections) {
          // 對每個移動區塊進行處理
          for (const section of moveSections) {
            console.log("找到移動區塊:", section);
            
            // 提取單獨的移動指令
            const moveInstructionPattern = /(⬆️|⬇️|✅)?\s*(move|transfer|shift|reallocate)\s+(?:NT\$\s*)?(\d+(?:[,.]\d+)*)\s*(?:k|thousand|萬|万)?(?:\s+(?:from|out of)\s+)(RR\d)(?:\s+(?:to|into)\s+)(RR\d)/gi;
            
            let moveMatch;
            while ((moveMatch = moveInstructionPattern.exec(section)) !== null) {
              const amountStr = moveMatch[3].trim();
              const sourceRR = moveMatch[4].trim();
              const targetRR = moveMatch[5].trim();
              
              // 解析金額
              let amount = parseNumberFromString(amountStr);
              
              if (isNaN(amount) || amount <= 0) continue;
              
              // 建立唯一標識符來防止重複處理
              const moveKey = `${amount}-${sourceRR}-${targetRR}`;
              if (processedMoves.has(moveKey)) continue;
              
              processedMoves.add(moveKey);
              
              // 更新建議
              extractedRecommendations[sourceRR] = (extractedRecommendations[sourceRR] || 0) - amount;
              extractedRecommendations[targetRR] = (extractedRecommendations[targetRR] || 0) + amount;
              
              console.log(`結構化檢測：從 ${sourceRR} 移動 ${amount} 到 ${targetRR}`);
              foundRecommendations = true;
            }
          }
        }
      };
      
      structuredMovesCheck();
    }
    
    // 如果找到了建議但不完整，嘗試填補缺失的信息
    const fillMissingPairs = () => {
      // 檢查是否有單一的增加或減少
      const increases = [];
      const decreases = [];
      
      // 識別源RR和目標RR
      for (const [rr, amount] of Object.entries(extractedRecommendations)) {
        if (amount > 0) increases.push([rr, amount]);
        else if (amount < 0) decreases.push([rr, amount]);
      }
      
      // 如果只有增加但沒有減少，尋找可能的資金來源
      if (increases.length > 0 && decreases.length === 0) {
        for (const [targetRR, amount] of increases) {
          // 從上下文尋找可能的資金來源
          const sourcePattern = new RegExp(`(?:(?:from|out of)\\s+)(RR\\d)(?:\\s+(?:to|into)\\s+${targetRR})`, 'i');
          const sourceMatch = processedResponse.match(sourcePattern);
          
          if (sourceMatch) {
            const sourceRR = sourceMatch[1];
            if (!(sourceRR in extractedRecommendations)) {
              extractedRecommendations[sourceRR] = -amount;
              console.log(`填補缺失信息: ${sourceRR} 減少 ${amount} (與 ${targetRR} 對應)`);
            }
          }
        }
      }
      
      // 如果只有減少但沒有增加，尋找可能的資金目標
      if (decreases.length > 0 && increases.length === 0) {
        for (const [sourceRR, amount] of decreases) {
          // 從上下文尋找可能的資金目標
          const targetPattern = new RegExp(`(?:(?:from|out of)\\s+${sourceRR}(?:\\s+(?:to|into)\\s+))(RR\\d)`, 'i');
          const targetMatch = processedResponse.match(targetPattern);
          
          if (targetMatch) {
            const targetRR = targetMatch[1];
            if (!(targetRR in extractedRecommendations)) {
              extractedRecommendations[targetRR] = -amount; // 負的負數，即為正數
              console.log(`填補缺失信息: ${targetRR} 增加 ${-amount} (與 ${sourceRR} 對應)`);
            }
          }
        }
      }
    };

    // 在平衡總額之前，嘗試填補缺失的配對信息
    fillMissingPairs();
    
    // 6. 確保建議平衡 (總和應該為零)
    const totalChange = Object.values(extractedRecommendations).reduce((sum, val) => sum + val, 0);
    
    // 如果總變化與零相差太大，嘗試平衡
    if (Math.abs(totalChange) > 1000) {
      console.log(`總變化額度: ${totalChange}，嘗試平衡建議`);
      
      // 如果只有一個建議，嘗試尋找對應的另一個RR
      if (Object.keys(extractedRecommendations).length === 1) {
        const [rr, amount] = Object.entries(extractedRecommendations)[0];
        
        // 尋找文本中提到的其他RR
        const otherRRPattern = /(?:RR\d)(?!\s*(?:to|would be|should be|will be|becomes))/g;
        const allRRs = [...processedResponse.matchAll(otherRRPattern)].map(m => m[0]);
        
        // 找到不同於當前RR的其他RR
        const otherRRs = [...new Set(allRRs)].filter(r => r !== rr);
        
        if (otherRRs.length > 0) {
          // 優先選擇在文本中具有相反動作的RR
          let oppositeRR = null;
          
          if (amount > 0) {
            // 如果當前是增加，尋找減少的RR
            const decreasePattern = new RegExp(`(decrease|reduce|reducing|decreasing).*?(${otherRRs.join('|')})`, 'i');
            const decreaseMatch = processedResponse.match(decreasePattern);
            if (decreaseMatch) {
              oppositeRR = decreaseMatch[2];
            }
          } else {
            // 如果當前是減少，尋找增加的RR
            const increasePattern = new RegExp(`(increase|increasing).*?(${otherRRs.join('|')})`, 'i');
            const increaseMatch = processedResponse.match(increasePattern);
            if (increaseMatch) {
              oppositeRR = increaseMatch[2];
            }
          }
          
          // 如果找到具有相反動作的RR，設置相反的金額
          if (oppositeRR) {
            extractedRecommendations[oppositeRR] = -amount;
            console.log(`平衡建議: 設置 ${oppositeRR} 為 ${-amount}`);
          } else {
            // 否則使用第一個其他RR
            extractedRecommendations[otherRRs[0]] = -amount;
            console.log(`平衡建議: 設置 ${otherRRs[0]} 為 ${-amount}`);
          }
        }
      } else if (Object.keys(extractedRecommendations).length > 1) {
        // 如果有多個建議，分配差額
        // 找出最大變化的RR
        let maxKey = Object.keys(extractedRecommendations).reduce((a, b) => 
          Math.abs(extractedRecommendations[a]) > Math.abs(extractedRecommendations[b]) ? a : b
        );
        
        // 調整該RR使總和為零
        extractedRecommendations[maxKey] -= totalChange;
        console.log(`平衡建議: 調整 ${maxKey} 由 ${extractedRecommendations[maxKey] + totalChange} 到 ${extractedRecommendations[maxKey]}`);
      }
    }
    
    // 7. 最後驗證：檢查是否為單一來源多個目標的情況
    const validateSingleSourceMultiTarget = () => {
      // 計算每個RR的總變化量
      const totalChanges = {};
      let sourceRRs = [];
      let targetRRs = [];
      
      // 識別源RR和目標RR
      for (const [rr, amount] of Object.entries(extractedRecommendations)) {
        if (amount < 0) sourceRRs.push(rr);
        else if (amount > 0) targetRRs.push(rr);
        
        totalChanges[rr] = amount;
      }
      
      // 檢查源RR是否匹配"from RR1"這種模式
      if (sourceRRs.length === 1 && targetRRs.length >= 2) {
        const sourceRR = sourceRRs[0];
        // 查找文本中是否有多次提到從這個RR轉出
        const sourceMatches = [...processedResponse.matchAll(new RegExp(`from\\s+${sourceRR}\\s+to`, 'gi'))];
        
        if (sourceMatches.length >= targetRRs.length) {
          console.log(`檢測到單一來源(${sourceRR})多個目標情況，驗證總額是否一致`);
        }
      }
    };
    
    validateSingleSourceMultiTarget();
    
    console.log("Final extracted recommendations:", extractedRecommendations);
    return extractedRecommendations;
  };
  
  /**
   * 從字符串中解析數字
   * @param {string} str - 包含數字的字符串
   * @returns {number} 解析出的數字
   */
  function parseNumberFromString(str) {
    if (!str) return NaN;
    
    // 移除所有非數字字符（保留小數點）
    const cleanedStr = str.replace(/[^\d.]/g, '');
    
    // 解析為數字
    return parseInt(cleanedStr, 10);
  }