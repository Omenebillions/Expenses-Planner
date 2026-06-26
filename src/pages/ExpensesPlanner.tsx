import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { formatCurrency } from '../lib/currency';
import { usePrivacy } from '../contexts/PrivacyContext';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  PieChart, 
  AlertCircle,
  Briefcase,
  Gift, 
  DollarSign, 
  CheckCircle, 
  X, 
  FileText,
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firestoreService, Income, Budget, IncomeAllocation } from '../services/firestoreService';
import { useUI } from '../contexts/UIContext';

const EXPENSE_CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Utilities', 'Insurance', 
  'Healthcare', 'Debt', 'Personal', 'Savings', 'Entertainment', 'Other'
];

const INCOME_CATEGORIES = [
  { value: 'Salary', label: 'Salary 💼', color: 'indigo' },
  { value: 'Side Business', label: 'Side Business 🚀', color: 'emerald' },
  { value: 'Gift', label: 'Incoming Gift 🎁', color: 'amber' },
  { value: 'Other', label: 'Other Income 💵', color: 'slate' }
];

export default function ExpensesPlanner() {
  const { user, userProfile } = useAuth();
  const { isPrivacyMode } = usePrivacy();
  const currencyCode = userProfile?.currency || 'USD';
  
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const currentMonthStr = format(currentDate, 'yyyy-MM');

  // Core States
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals Info
  const { isAddIncomeOpen, setIsAddIncomeOpen } = useUI();
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  // Error Notifications
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const [isAddingAllocationToSelected, setIsAddingAllocationToSelected] = useState(false);
  const [editingAllocIndex, setEditingAllocIndex] = useState<number | null>(null);
  const [selectedTempAllocCategory, setSelectedTempAllocCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [selectedTempAllocName, setSelectedTempAllocName] = useState('');
  const [selectedTempAllocAmount, setSelectedTempAllocAmount] = useState('');

  // Income Input Form States
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState<'Salary' | 'Side Business' | 'Gift' | 'Other'>('Salary');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeActualAmount, setNewIncomeActualAmount] = useState('');
  const [newIncomeNotes, setNewIncomeNotes] = useState('');
  const [newIncomeAllocations, setNewIncomeAllocations] = useState<IncomeAllocation[]>([]);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  
  // Custom states to add specific Allocation line inside Add Income form
  const [tempAllocCategory, setTempAllocCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [tempAllocName, setTempAllocName] = useState('');
  const [tempAllocAmount, setTempAllocAmount] = useState('');

  // Expense Input Form States
  const [newExpenseCategory, setNewExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Loading Data from Firestore & local fallbacks
  const loadAllPlannerData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedBudgets, fetchedIncomes] = await Promise.all([
        firestoreService.getBudgets(user.id, currentMonthStr),
        firestoreService.getIncomes(user.id, currentMonthStr)
      ]);
      setBudgets(fetchedBudgets);
      setIncomes(fetchedIncomes);
    } catch (e) {
      console.error('Error loading Expenses Planner data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPlannerData();
  }, [user, currentMonthStr]);

  // Derived Totals
  const totalExpectedIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  }, [incomes]);

  const totalActualIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => sum + (inc.actualAmount || 0), 0);
  }, [incomes]);

  const allTargetAllocations = useMemo(() => {
    const list: { id: string; category: string; amount: number; sourceName: string; name?: string; originalIncome: Income }[] = [];
    incomes.forEach(inc => {
      if (inc.allocationPlan) {
        inc.allocationPlan.forEach((alloc, idx) => {
          list.push({
            id: `alloc-${inc.id}-${idx}`,
            category: alloc.category,
            amount: alloc.amount,
            sourceName: inc.sourceName,
            name: alloc.name,
            originalIncome: inc
          });
        });
      }
    });
    return list;
  }, [incomes]);

  const combinedPlans = useMemo(() => {
    const plans: any[] = budgets.map(b => ({
      id: b.id,
      category: b.category,
      amount: b.amount,
      isAllocation: false,
      sourceName: 'General Pool'
    }));
    
    allTargetAllocations.forEach(a => {
      plans.push({
        id: a.id,
        category: a.category,
        amount: a.amount,
        isAllocation: true,
        sourceName: a.sourceName,
        name: a.name,
        originalIncome: a.originalIncome
      });
    });
    
    return plans;
  }, [budgets, allTargetAllocations]);

  const totalPlannedExpenses = useMemo(() => {
    const generalTotal = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const allocTotal = allTargetAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    return generalTotal + allocTotal;
  }, [budgets, allTargetAllocations]);

  const remainingToPlan = totalExpectedIncome - totalPlannedExpenses;
  const planningPercentage = totalExpectedIncome > 0 ? (totalPlannedExpenses / totalExpectedIncome) * 100 : 0;

  // Handles adding/saving a planned expense
  const handleAddExpenseClick = () => {
    setIsAddExpenseModalOpen(true);
    setNewExpenseCategory(EXPENSE_CATEGORIES[0]);
    setNewExpenseAmount('');
    setExpenseError(null);
  };

  const handleSaveExpensePlan = async () => {
    if (!user) return;
    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (amount > remainingToPlan) {
      setExpenseError(`Over planning! This expense goes over your remaining expected income by ${formatCurrency(amount - remainingToPlan, currencyCode, false)}.`);
      return;
    }

    try {
      await firestoreService.saveBudget({
        user_id: user.id,
        category: newExpenseCategory,
        amount,
        period: currentMonthStr
      });
      setIsAddExpenseModalOpen(false);
      loadAllPlannerData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExpensePlan = async (id: string) => {
    try {
      await firestoreService.deleteBudget(id);
      loadAllPlannerData();
    } catch (e) {
      console.error(e);
    }
  };

  // Handles adding specific allocation lines in the Income Form
  const addAllocationLine = () => {
    const amount = parseFloat(tempAllocAmount);
    if (isNaN(amount) || amount <= 0) return;

    const expectedIncomeVal = parseFloat(newIncomeAmount);
    if (!isNaN(expectedIncomeVal) && expectedIncomeVal > 0) {
      const currentAllocated = newIncomeAllocations.reduce((acc, curr) => acc + curr.amount, 0);
      if (currentAllocated + amount > expectedIncomeVal) {
        alert(`Cannot allocate more than the expected income. You have ${formatCurrency(expectedIncomeVal - currentAllocated, currencyCode, false)} remaining.`);
        return;
      }
    }

    // We do not check for existing category anymore if we have distinct names, or maybe we still do.
    // Let's just push it since names can differentiate them
    setNewIncomeAllocations([...newIncomeAllocations, { 
      category: tempAllocCategory, 
      name: tempAllocName.trim() || undefined,
      amount 
    }]);
    setTempAllocAmount('');
    setTempAllocName('');
  };

  const removeAllocationLine = (index: number) => {
    setNewIncomeAllocations(newIncomeAllocations.filter((_, idx) => idx !== index));
  };

  const handleAddAllocationToSelected = async () => {
    if (!user || !selectedIncome) return;
    const amount = parseFloat(selectedTempAllocAmount);
    if (isNaN(amount) || amount <= 0) return;

    let updatedAllocations = [...(selectedIncome.allocationPlan || [])];
    
    // Calculate current allocated ignoring the one being edited
    const currentAllocated = updatedAllocations.reduce((acc, curr, idx) => {
       if (editingAllocIndex === idx) return acc;
       return acc + curr.amount;
    }, 0);

    if (currentAllocated + amount > selectedIncome.amount) {
      alert(`Cannot allocate more than the expected income. You have ${formatCurrency(selectedIncome.amount - currentAllocated, currencyCode, false)} remaining.`);
      return;
    }

    if (editingAllocIndex !== null) {
      updatedAllocations[editingAllocIndex] = {
        category: selectedTempAllocCategory,
        name: selectedTempAllocName.trim() || undefined,
        amount
      };
    } else {
      updatedAllocations.push({ 
        category: selectedTempAllocCategory, 
        name: selectedTempAllocName.trim() || undefined,
        amount 
      });
    }

    try {
      const updatedIncome = await firestoreService.saveIncome({
        ...selectedIncome,
        allocationPlan: updatedAllocations
      });
      setSelectedIncome(null); // Return to home!
      setIsAddingAllocationToSelected(false);
      setEditingAllocIndex(null);
      setSelectedTempAllocAmount('');
      setSelectedTempAllocName('');
      loadAllPlannerData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditAllocationClick = (index: number, alloc: IncomeAllocation) => {
    setIsAddingAllocationToSelected(true);
    setEditingAllocIndex(index);
    setSelectedTempAllocCategory(alloc.category);
    setSelectedTempAllocName(alloc.name || '');
    setSelectedTempAllocAmount(alloc.amount.toString());
  };

  const handleRemoveAllocationFromSelected = async (index: number) => {
    if (!user || !selectedIncome) return;
    let updatedAllocations = [...(selectedIncome.allocationPlan || [])];
    updatedAllocations.splice(index, 1);
    try {
      const updatedIncome = await firestoreService.saveIncome({
        ...selectedIncome,
        allocationPlan: updatedAllocations
      });
      setSelectedIncome(updatedIncome);
      loadAllPlannerData();
    } catch (e) {
      console.error(e);
    }
  };

  // Saves new expected income to Firestore
  const handleAddIncomeClick = () => {
    setEditingIncomeId(null);
    setNewIncomeName('');
    setNewIncomeCategory('Salary');
    setNewIncomeAmount('');
    setNewIncomeActualAmount('');
    setNewIncomeNotes('');
    setNewIncomeAllocations([]);
    setIsAddIncomeOpen(true);
  };

  const handleEditIncomeClick = (income: Income) => {
    setEditingIncomeId(income.id);
    setNewIncomeName(income.sourceName);
    setNewIncomeCategory(income.category as any);
    setNewIncomeAmount(income.amount.toString());
    setNewIncomeActualAmount(income.actualAmount ? income.actualAmount.toString() : '');
    setNewIncomeNotes(income.notes || '');
    setNewIncomeAllocations(income.allocationPlan || []);
    setSelectedIncome(null);
    setIsAddIncomeOpen(true);
  };

  const handleSaveIncome = async () => {
    if (!user) return;
    const expected = parseFloat(newIncomeAmount);
    if (isNaN(expected) || expected <= 0) return;

    const actual = parseFloat(newIncomeActualAmount) || 0;

    try {
      await firestoreService.saveIncome({
        id: editingIncomeId || undefined,
        user_id: user.id,
        category: newIncomeCategory,
        sourceName: newIncomeName.trim() || `${newIncomeCategory} Source`,
        amount: expected,
        actualAmount: actual,
        period: currentMonthStr,
        isFollowed: false,
        allocationPlan: newIncomeAllocations,
        notes: newIncomeNotes.trim()
      });
      setIsAddIncomeOpen(false);
      setEditingIncomeId(null);
      loadAllPlannerData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await firestoreService.deleteIncome(id);
      setSelectedIncome(null);
      loadAllPlannerData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleConfirmFollowed = async (income: Income) => {
    const updatedStatus = !income.isFollowed;
    try {
      await firestoreService.updateIncomeFollowed(income.id, updatedStatus);
      // Update local state directly
      setIncomes(prev => prev.map(item => item.id === income.id ? { ...item, isFollowed: updatedStatus } : item));
      if (selectedIncome?.id === income.id) {
        setSelectedIncome(prev => prev ? { ...prev, isFollowed: updatedStatus } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helpers for nice badges
  const getIncomeCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'Salary':
        return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Briefcase size={16} /> };
      case 'Side Business':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <TrendingUp size={16} /> };
      case 'Gift':
        return { color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Gift size={16} /> };
      default:
        return { color: 'bg-slate-50 text-slate-700 border-slate-100', icon: <DollarSign size={16} /> };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-black text-gray-900 tracking-tight">Expenses & Income Planner</h1>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
         <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
         </button>
         <h2 className="font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
         <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
         </button>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expected Income Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Expected Income</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {formatCurrency(totalExpectedIncome, currencyCode, isPrivacyMode)}
              </h3>
            </div>
            <button 
              onClick={handleAddIncomeClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all"
            >
              <Plus size={14} /> Add Income
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
            <span>Actual Received:</span>
            <span className="font-bold text-gray-700">
              {formatCurrency(totalActualIncome, currencyCode, isPrivacyMode)}
            </span>
          </div>
        </div>

        {/* Expenses Planning Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Planned Expenses</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">
                  {formatCurrency(totalPlannedExpenses, currencyCode, isPrivacyMode)}
                </h3>
              </div>
              <div className="text-right text-xs">
                <span className="text-gray-400">Remaining to Alloc:</span>
                <p className={`font-black text-sm ${remainingToPlan < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {formatCurrency(remainingToPlan, currencyCode, isPrivacyMode)}
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
               <div 
                 className={`h-full rounded-full transition-all duration-500 ${planningPercentage >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                 style={{ width: `${Math.min(planningPercentage, 100)}%` }}
               />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Income Left, Expenses Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* INCOMES LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Expected Incomes</span>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                {incomes.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading incomes...</div>
          ) : incomes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 border-dashed">
               <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
               <p className="text-gray-500 text-sm font-medium">No expected incomes added for this month.</p>
               <button 
                 onClick={handleAddIncomeClick}
                 className="mt-3 text-indigo-600 font-bold text-xs hover:underline"
               >
                 + Add Expected Income Entry
               </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {incomes.map((inc) => {
                const details = getIncomeCategoryDetails(inc.category);
                const allocatedTotal = inc.allocationPlan?.reduce((sum, item) => sum + item.amount, 0) || 0;
                const remainingBalance = inc.amount - allocatedTotal;
                return (
                  <motion.div 
                    layoutId={`inc-card-${inc.id}`}
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncome(inc);
                      setIsAddingAllocationToSelected(false);
                      setEditingAllocIndex(null);
                      setSelectedTempAllocAmount('');
                      setSelectedTempAllocName('');
                    }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className={`p-2.5 rounded-xl border ${details.color} shrink-0`}>
                        {details.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{inc.sourceName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider shrink-0">
                            {inc.category}
                          </span>
                          <span className="text-gray-200 shrink-0">•</span>
                          {remainingBalance === 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0">
                              Fully Mapped
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${
                              remainingBalance < 0 
                                ? 'text-red-600 bg-red-50' 
                                : 'text-indigo-600 bg-indigo-50/50'
                            }`}>
                              Bal: {formatCurrency(remainingBalance, currencyCode, isPrivacyMode)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-950 text-sm">
                        {formatCurrency(inc.amount, currencyCode, isPrivacyMode)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {inc.isFollowed ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            Plan Followed 🎉
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.2 rounded-md">
                            Pending confirmation
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* PLANNED EXPENSES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Expenses Outlays</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                {combinedPlans.length}
              </span>
            </h2>
            {totalExpectedIncome > 0 && remainingToPlan > 0 && (
              <button 
                onClick={handleAddExpenseClick}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Plus size={14} /> Allocate
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading plans...</div>
          ) : combinedPlans.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 border-dashed">
               <PieChart size={32} className="mx-auto text-gray-300 mb-2" />
               <p className="text-gray-500 text-sm font-medium">No expenses mapped yet.</p>
               {totalExpectedIncome > 0 ? (
                 <button 
                   onClick={handleAddExpenseClick}
                   className="mt-3 text-emerald-600 font-bold text-xs hover:underline"
                 >
                   + Allocate expected income
                 </button>
               ) : (
                 <p className="text-xs text-gray-400 mt-1">Please set expected incomes to start budgeting allocations.</p>
               )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
               {combinedPlans.map((plan) => (
                 <div 
                   key={plan.id} 
                   onClick={() => {
                     if (plan.isAllocation && plan.originalIncome) {
                       setSelectedIncome(plan.originalIncome);
                       setIsAddingAllocationToSelected(false);
                       setEditingAllocIndex(null);
                       setSelectedTempAllocAmount('');
                       setSelectedTempAllocName('');
                     }
                   }}
                   className={`flex items-center justify-between p-4 transition-all ${
                     plan.isAllocation 
                       ? 'hover:bg-indigo-55/35 cursor-pointer' 
                       : 'hover:bg-gray-55/35'
                   }`}
                 >
                    <div className="min-w-0 pr-2 text-left">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-900 text-sm">{plan.category}</h4>
                        {plan.isAllocation && (
                          <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50/75 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                            Mapped
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {plan.isAllocation ? `From: ${plan.sourceName}` : 'General Pool Budget'}
                        {plan.name ? ` • ${plan.name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                       <p className={`font-black text-sm ${plan.isAllocation ? 'text-indigo-600' : 'text-gray-900'}`}>
                         {formatCurrency(plan.amount, currencyCode, isPrivacyMode)}
                       </p>
                       {plan.isAllocation ? (
                         <span className="text-gray-300 text-xs font-bold pl-1">→</span>
                       ) : (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteExpensePlan(plan.id);
                           }}
                           className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

      </div>

      {/* --- INLINE MODALS --- */}
      <AnimatePresence>
        
        {/* ADD EXPECTED INCOME MODAL */}
        {isAddIncomeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 30 }}
               className="bg-white rounded-3xl p-6 pb-20 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-gray-900">
                  {editingIncomeId ? 'Edit Expected Income' : 'Add Expected Income'}
                </h3>
                <button onClick={() => setIsAddIncomeOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Source Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Regular Salary Job, Birthday Gift, Etsy business"
                      value={newIncomeName}
                      onChange={e => setNewIncomeName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Income Type</label>
                    <select
                      value={newIncomeCategory}
                      onChange={e => setNewIncomeCategory(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      {INCOME_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Expected Amount</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newIncomeAmount}
                      onChange={e => setNewIncomeAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Actual Amount Received so far (Optional)</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newIncomeActualAmount}
                      onChange={e => setNewIncomeActualAmount(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Specific Allocation Plan Builder */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">🛠️ Map Target Allocation Plan (Optional)</h4>
                  
                  {/* Allocation Rows Adding Form */}
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex gap-2">
                      <select 
                        value={tempAllocCategory}
                        onChange={e => setTempAllocCategory(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                      >
                        {EXPENSE_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Name (Optional)"
                        value={tempAllocName}
                        onChange={e => setTempAllocName(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Amount"
                        value={tempAllocAmount}
                        onChange={e => setTempAllocAmount(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none font-bold"
                      />
                      <button 
                        type="button" 
                        onClick={addAllocationLine}
                        className="w-24 bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        Add Line
                      </button>
                    </div>
                  </div>

                  {/* Added Lines List */}
                  {newIncomeAllocations.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">No specific allocations drawn up for this source yet. You can keep it unallocated or assign it above.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {newIncomeAllocations.map((alloc, idx) => (
                        <div key={idx} className="flex flex-col bg-white px-3 py-1.5 rounded-lg text-xs border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700">{alloc.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-indigo-600">
                                {formatCurrency(alloc.amount, currencyCode, false)}
                              </span>
                              <button type="button" onClick={() => removeAllocationLine(idx)} className="text-red-400 hover:text-red-600 font-bold">
                                ✕
                              </button>
                            </div>
                          </div>
                          {alloc.name && <span className="text-[10px] text-gray-500 mt-0.5">{alloc.name}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notes & Objectives</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Save 50% for college fund, allow rest for casual outings."
                    value={newIncomeNotes}
                    onChange={e => setNewIncomeNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddIncomeOpen(false)}
                    className="w-1/2 py-2.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveIncome}
                    className="w-1/2 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                  >
                    {editingIncomeId ? 'Update Income Source' : 'Save Income Source'}
                  </button>
                </div>

                {/* Keyboard padding spacer to allow comfortable scrolling above the mobile keyboard */}
                <div className="h-64 sm:h-0" />

              </div>
            </motion.div>
          </div>
        )}

        {/* INCOME DETAILS SHEET (OPEN TO SEE PLAN & CONFIRM FOLLOWED STATUS) */}
        {selectedIncome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
               layoutId={`inc-card-${selectedIncome.id}`}
               className="bg-white rounded-3xl p-6 pb-20 w-full max-w-md shadow-2xl relative overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider bg-indigo-50 px-2.5 py-0.8 rounded-full">
                    {selectedIncome.category}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-2">{selectedIncome.sourceName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{format(currentDate, 'MMMM yyyy')}</p>
                </div>
                <button 
                  onClick={() => setSelectedIncome(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats Block */}
              {(() => {
                const allocatedTotal = selectedIncome.allocationPlan?.reduce((a, b) => a + b.amount, 0) || 0;
                const remainingBalance = selectedIncome.amount - allocatedTotal;
                const progressPct = selectedIncome.amount > 0 ? (allocatedTotal / selectedIncome.amount) * 100 : 0;
                return (
                  <div className="space-y-4 mb-5">
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl">
                      <div className="text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Expected</span>
                        <span className="text-xs font-black text-gray-950 mt-0.5 block">
                          {formatCurrency(selectedIncome.amount, currencyCode, isPrivacyMode)}
                        </span>
                      </div>
                      <div className="text-center border-x border-gray-150">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Allocated</span>
                        <span className="text-xs font-black text-indigo-700 mt-0.5 block">
                          {formatCurrency(allocatedTotal, currencyCode, isPrivacyMode)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block">Balance</span>
                        <span className={`text-xs font-black mt-0.5 block ${remainingBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {formatCurrency(remainingBalance, currencyCode, isPrivacyMode)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
                        <span>Allocation Progress</span>
                        <span>{progressPct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${progressPct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(progressPct, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ALLOCATION PLAN DETAIL BREAKDOWN */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest pl-1 mb-2">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <FileText size={14} className="text-gray-400" />
                    <span>Configured Targets</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block">Remaining:</span>
                    <span className={`font-black ${(selectedIncome.amount - (selectedIncome.allocationPlan?.reduce((a,b)=>a+b.amount,0)||0)) < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {formatCurrency(selectedIncome.amount - (selectedIncome.allocationPlan?.reduce((a,b)=>a+b.amount,0)||0), currencyCode, isPrivacyMode)}
                    </span>
                  </div>
                </div>

                {(!selectedIncome.allocationPlan || selectedIncome.allocationPlan.length === 0) ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-150 text-center">
                    <p className="text-xs text-gray-400 italic">No specific categories map setup for this source yet. It flows fully to the general pool.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 divide-y divide-gray-150 max-h-48 overflow-y-auto">
                    {selectedIncome.allocationPlan.map((alloc, idx) => {
                      const sharePct = selectedIncome.amount > 0 ? (alloc.amount / selectedIncome.amount) * 100 : 0;
                      return (
                        <div key={idx} className="p-3">
                          <div className="flex justify-between items-center text-xs font-bold mb-1">
                            <span className="text-gray-700">{alloc.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-600">{formatCurrency(alloc.amount, currencyCode, isPrivacyMode)} ({sharePct.toFixed(0)}%)</span>
                              <div className="flex items-center gap-1.5 ml-2">
                                <button onClick={() => handleEditAllocationClick(idx, alloc)} className="text-gray-400 hover:text-indigo-600 font-bold transition-colors">✎</button>
                                <button onClick={() => handleRemoveAllocationFromSelected(idx)} className="text-gray-400 hover:text-red-600 font-bold transition-colors">✕</button>
                              </div>
                            </div>
                          </div>
                          {alloc.name && <div className="text-[10px] text-gray-500 mb-1">{alloc.name}</div>}
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(sharePct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {isAddingAllocationToSelected ? (
                  <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 mt-3 space-y-2">
                    <div className="flex gap-2">
                      <select 
                        value={selectedTempAllocCategory}
                        onChange={(e) => setSelectedTempAllocCategory(e.target.value)}
                        className="w-1/2 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                      >
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Name (Optional)"
                        value={selectedTempAllocName}
                        onChange={(e) => setSelectedTempAllocName(e.target.value)}
                        className="w-1/2 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <input 
                      type="number" 
                      placeholder="Amount"
                      value={selectedTempAllocAmount}
                      onChange={(e) => setSelectedTempAllocAmount(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                    />
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => {
                          setIsAddingAllocationToSelected(false);
                          setEditingAllocIndex(null);
                        }}
                        className="flex-1 py-2 text-xs font-bold text-gray-500 bg-white rounded-xl hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddAllocationToSelected}
                        className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                      >
                        {editingAllocIndex !== null ? 'Update Target' : 'Add Target'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingAllocationToSelected(true)}
                    className="w-full py-2.5 mt-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Add Planned Expense to Source
                  </button>
                )}
              </div>

              {/* Notes */}
              {selectedIncome.notes && (
                <div className="mb-6 p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Sparkles size={11} /> Source specific notes
                  </p>
                  <p className="text-xs text-indigo-900 font-medium leading-relaxed italic">"{selectedIncome.notes}"</p>
                </div>
              )}

              {/* Big "Confirm Plan Was Followed" Button Block */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <button 
                  onClick={() => toggleConfirmFollowed(selectedIncome)}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                    selectedIncome.isFollowed 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <CheckCircle size={18} />
                  <span>
                    {selectedIncome.isFollowed 
                       ? '✓ YES! Plan was followed perfectly 🎉' 
                       : 'Confirm Plan was Followed'}
                  </span>
                </button>

                <div className="flex justify-between items-center px-1">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleEditIncomeClick(selectedIncome)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-bold transition-all"
                    >
                      Edit Source
                    </button>
                    <button 
                      onClick={() => handleDeleteIncome(selectedIncome.id)}
                      className="text-xs text-gray-400 hover:text-red-500 font-bold transition-all"
                    >
                      Delete Source
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
                    <Info size={11} /> Confirming locks your commitment
                  </p>
                </div>
              </div>

              {/* Extra spacing to allow scrolling above the mobile keyboard when adding/editing allocations */}
              {isAddingAllocationToSelected && (
                <div className="h-64 sm:h-0" />
              )}

            </motion.div>
          </div>
        )}

        {/* ADD PLANNED EXPENSE PLAN (ALLOCATION) MODAL */}
        {isAddExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 pb-20 w-full max-w-sm shadow-xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-lg font-black text-gray-900 mb-4">Add Planned Expense Allocation</h2>
              
              <AnimatePresence>
                 {expenseError && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="bg-red-55/35 text-red-700 p-3 rounded-xl text-xs font-medium flex items-start gap-2 mb-3 border border-red-200 overflow-hidden"
                   >
                     <AlertCircle size={15} className="shrink-0 mt-0.5" />
                     <span>{expenseError}</span>
                   </motion.div>
                 )}
              </AnimatePresence>

              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Expense Category</label>
                    <select 
                      value={newExpenseCategory}
                      onChange={(e) => {
                        setNewExpenseCategory(e.target.value);
                        if (expenseError) setExpenseError(null);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                    >
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Monthly Planned Target Amount</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newExpenseAmount}
                      onChange={(e) => {
                        setNewExpenseAmount(e.target.value);
                        if (expenseError) setExpenseError(null);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none font-bold"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Available in budget: {formatCurrency(remainingToPlan, currencyCode, false)}</p>
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setIsAddExpenseModalOpen(false)}
                      className="w-1/2 py-2.5 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveExpensePlan}
                      className="w-1/2 py-2.5 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 text-sm transition-colors"
                    >
                      Save Allocation Detail
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
