import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateDashboardReport = (data: any, t: any) => {
  const doc = new jsPDF();
  
  const brandName = "SHOPNO SONCHOY";
  const reportTitle = "Enterprise Financial Overview Report";
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Theme Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
  const secondaryColor: [number, number, number] = [100, 116, 139]; // slate-500

  // 1. Header Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Secure & Transparent Financial Management", 14, 28);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DATE: " + date, 150, 24);

  // 2. Report Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, 55);
  
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.5);
  doc.line(14, 59, 196, 59);

  // 3. Summary Metrics
  let yPos = 70;
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const formatCurrency = (val: number) => `BDT ${val.toLocaleString()}`;
  
  // Box 1: Current Fund
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, 42, 22, 2, 2, 'FD');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(t('admin_dashboard.current_fund'), 18, yPos + 8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.currentFund), 18, yPos + 16);

  // Box 2: Monthly Collection
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.roundedRect(60, yPos, 42, 22, 2, 2, 'FD');
  doc.text(t('admin_dashboard.todays_collection'), 64, yPos + 8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.todaysCollection), 64, yPos + 16);

  // Box 3: Active Members
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.roundedRect(106, yPos, 42, 22, 2, 2, 'FD');
  doc.text(t('admin_dashboard.active_members'), 110, yPos + 8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(data.activeMembers.toString(), 110, yPos + 16);

  // Box 4: Current Investment
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.roundedRect(152, yPos, 42, 22, 2, 2, 'FD');
  doc.text(t('admin_dashboard.current_investment'), 156, yPos + 8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.currentInvestment), 156, yPos + 16);

  yPos += 35;

  // 4. Recent Deposits Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t('admin_dashboard.recent_deposits'), 14, yPos);
  
  const depositRows = data.recentDeposits.map((txn: any) => [
    txn._id.slice(-6).toUpperCase(),
    new Date(txn.date).toLocaleDateString(),
    txn.userId?.name || 'Unknown User',
    txn.method || 'Transfer',
    formatCurrency(txn.amount)
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Ref ID', 'Date', 'Member Name', 'Method', 'Amount']],
    body: depositRows.length ? depositRows : [['-', '-', 'No recent deposits', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // 5. Pending Approvals Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(t('admin_dashboard.pending_approvals'), 14, yPos);
  
  const pendingRows = data.pendingApprovals.map((item: any) => [
    item._id.slice(-6).toUpperCase(),
    new Date(item.date || item.requestDate).toLocaleDateString(),
    item.kind || 'Deposit',
    item.userId?.name || 'Unknown User',
    formatCurrency(item.amount)
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Ref ID', 'Date', 'Request Type', 'Requested By', 'Amount']],
    body: pendingRows.length ? pendingRows : [['-', '-', 'No pending approvals', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' }, // amber-500
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [254, 252, 232] }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      `Generated by Shopno Sonchoy System on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateMembersReport = (members: any[], t: any, profitShare: number = 0) => {
  const doc = new jsPDF();
  
  const brandName = "SHOPNO SONCHOY";
  const reportTitle = "Members & Accounts Directory";
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Theme Colors
  const primaryColor: [number, number, number] = [15, 23, 42];
  const secondaryColor: [number, number, number] = [100, 116, 139];

  // Header Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Complete Member Directory and Balances", 14, 28);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DATE: " + date, 150, 24);

  // Report Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, 55);
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 59, 196, 59);

  const formatCurrency = (val: number) => `BDT ${val.toLocaleString()}`;

  const memberRows = members.map((m: any) => [
    m.memberId || 'N/A',
    m.name || 'N/A',
    m.phone || 'N/A',
    m.email || 'N/A',
    formatCurrency((m.balance || 0) + profitShare),
    formatCurrency(m.loanBalance || 0)
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['ID', 'Name', 'Phone', 'Email', 'Wallet Balance', 'Loan Balance']],
    body: memberRows.length ? memberRows : [['-', '-', 'No members found', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      `Generated by Shopno Sonchoy System on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Members_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateDepositsReport = (txns: any[], t: any) => {
  const doc = new jsPDF();
  
  const brandName = "SHOPNO SONCHOY";
  const reportTitle = "Transactions & Deposit Approvals";
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Theme Colors
  const primaryColor: [number, number, number] = [15, 23, 42];
  const secondaryColor: [number, number, number] = [100, 116, 139];

  // Header Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Full Record of All Deposits and Transactions", 14, 28);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DATE: " + date, 150, 24);

  // Report Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, 55);
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 59, 196, 59);

  const formatCurrency = (val: number) => `BDT ${val.toLocaleString()}`;
  
  const txnRows = txns.map((txn: any) => [
    txn._id.slice(-6).toUpperCase(),
    new Date(txn.date).toLocaleDateString(),
    txn.userId?.name || 'Unknown User',
    formatCurrency(txn.amount),
    txn.method || 'N/A',
    txn.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Ref ID', 'Date', 'Member Name', 'Amount', 'Method', 'Status']],
    body: txnRows.length ? txnRows : [['-', '-', 'No transactions found', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      `Generated by Shopno Sonchoy System on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Deposits_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateWithdrawalExpenseReport = (withdrawals: any[], totalWithdrawn: number, t?: any) => {
  const doc = new jsPDF();
  
  const brandName = "SHOPNO SONCHOY";
  const reportTitle = "Master Wallet Withdrawal & Expense History Report";
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const primaryColor: [number, number, number] = [225, 29, 72]; // rose-600
  const secondaryColor: [number, number, number] = [100, 116, 139]; // slate-500

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Official Master Wallet Expense Audit & Withdrawal Log Statement", 14, 28);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("DATE: " + date, 150, 24);

  // 2. Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, 52);
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 56, 196, 56);

  // 3. Summary Cards Box
  const formatCurrency = (val: number) => `BDT ${val.toLocaleString()}`;
  let yPos = 64;

  // Lifetime Withdrawals Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, yPos, 85, 22, 2, 2, 'FD');
  doc.setTextColor(225, 29, 72);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("TOTAL LIFETIME WITHDRAWN", 18, yPos + 8);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalWithdrawn), 18, yPos + 16);

  // Total Recorded Entries Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(111, yPos, 85, 22, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("TOTAL EXPENSE ENTRIES RECORDED", 115, yPos + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${withdrawals.length} Logs`, 115, yPos + 16);

  // 4. Withdrawal Audit Table
  const rows = withdrawals.map((w: any) => [
    `#${w._id.toString().slice(-6).toUpperCase()}`,
    new Date(w.date || w.createdAt || Date.now()).toLocaleString(),
    w.reference || 'Master Wallet Expense',
    w.userId?.name || 'Admin',
    formatCurrency(Number(w.amount) || 0),
    'APPROVED'
  ]);

  autoTable(doc, {
    startY: 94,
    head: [['Trx ID', 'Date & Time', 'Reason / Description', 'Withdrawn By', 'Amount', 'Status']],
    body: rows.length ? rows : [['-', '-', 'No withdrawal records found', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [254, 242, 242] }
  });

  // 5. Page Numbering Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(
      `Generated by Shopno Sonchoy Master Wallet System on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Master_Wallet_Withdrawal_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
