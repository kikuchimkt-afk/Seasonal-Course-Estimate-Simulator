
/* Seasonal App Styles */
.seasonal-table-container {
    width: 100%;
    margin-bottom: 20px;
}

.seasonal-table {
    width: 100%;
    border-collapse: collapse;
}

.seasonal-table th {
    font-size: 0.85rem;
    color: #666;
    padding: 8px;
    border-bottom: 2px solid #ddd;
    text-align: left;
}

.seasonal-table td {
    padding: 8px 4px;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
}

.seasonal-table-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 0.95rem;
}

.seasonal-table-input:focus {
    border-color: var(--primary);
    outline: none;
    background: #f0f9ff;
}

.del-row-btn {
    background: none;
    border: none;
    color: #ccc;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 5px;
    line-height: 1;
}

.del-row-btn:hover {
    color: #ef4444;
}

.stepper-compact {
    display: flex;
    align-items: center;
    gap: 3px;
    justify-content: flex-start; /* changed from center to avoid jumps */
}

.stepper-compact .stepper-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 4px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    font-weight: bold;
    color: var(--primary);
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stepper-compact .stepper-val {
    width: 40px;
    text-align: center;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px;
    font-size: 0.9rem;
    -moz-appearance: textfield;
}

.stepper-compact .stepper-val::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Tier Summary Box */
.tier-summary-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    justify-content: space-around;
    gap: 20px;
}

.tier-row {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.tier-label {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 4px;
    font-weight: bold;
}

.tier-val {
    font-size: 1.1rem;
    color: var(--text-main);
    margin-bottom: 2px;
}

.tier-price {
    font-size: 0.9rem;
    color: var(--primary);
}

@media (max-width: 600px) {
    .tier-summary-box {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    .tier-row {
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
    }
    .tier-row:last-child {
        border-bottom: none;
    }
    .seasonal-table th, .seasonal-table td {
        font-size: 0.8rem;
    }
    .stepper-compact .stepper-btn {
        width: 20px;
        height: 20px;
    }
    .seasonal-table-input {
        padding: 5px;
        font-size: 0.9rem;
    }
}
