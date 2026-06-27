import React, { useState, useEffect, useRef } from "react";
import {
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Circle,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  Award,
  ListTodo,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign
} from "lucide-react";

// Define Interfaces
interface Account {
  id: string;
  name: string;
  balance: number;
  type: "Bank" | "Cash";
  icon: string;
}

interface Transaction {
  id: string;
  type: "Expense" | "Income" | "Transfer";
  amount: number;
  category: string;
  accountId: string;
  toAccountId?: string;
  date: string; // YYYY-MM-DD
  note: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string;
  createdDate: string;
  completedDate?: string;
}

interface FocusPreset {
  id: string;
  name: string;
  minutes: number;
  icon: string;
}

interface Habit {
  id: string;
  name: string;
  createdDate: string;
}

interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  checked: boolean;
}

// Default initial records if LocalStorage is empty
const defaultAccounts: Account[] = [
  { id: "cbpay", name: "CB pay", balance: 40000, type: "Bank", icon: "Smartphone" },
  { id: "wavepay", name: "wave pay", balance: 60000, type: "Bank", icon: "Coins" },
  { id: "kpay", name: "k pay", balance: 70000, type: "Bank", icon: "CreditCard" },
  { id: "cash", name: "Cash", balance: 460000, type: "Cash", icon: "Wallet" },
];

const defaultTasks: Task[] = [
  {
    id: "T-1001",
    title: "Submit project proposal",
    description: "Finalize architecture and send spreadsheet parameters.",
    priority: "High",
    status: "Pending",
    dueDate: "2026-06-25",
    createdDate: "2026-06-23",
  },
  {
    id: "T-1002",
    title: "Prepare client presentation",
    description: "Draft Google Slides deck.",
    priority: "High",
    status: "Completed",
    dueDate: "2026-06-25",
    createdDate: "2026-06-23",
    completedDate: "2026-06-25",
  },
  {
    id: "T-1003",
    title: "Review and approve budget",
    description: "Audit department financial requests.",
    priority: "High",
    status: "Completed",
    dueDate: "2026-06-28",
    createdDate: "2026-06-23",
    completedDate: "2026-06-23",
  },
];

const defaultPresets: FocusPreset[] = [
  { id: "P-1001", name: "Learning", minutes: 25, icon: "📚" },
  { id: "P-1002", name: "Deep Work", minutes: 50, icon: "💻" },
  { id: "P-1003", name: "Break", minutes: 10, icon: "🏃" },
];

const defaultHabits: Habit[] = [
  { id: "H-1001", name: "web app", createdDate: "2026-06-01" },
  { id: "H-1002", name: "testingforhabit", createdDate: "2026-06-01" },
  { id: "H-1003", name: "test", createdDate: "2026-06-01" },
];

const defaultTransactions: Transaction[] = [
  {
    id: "TX-201",
    type: "Expense",
    amount: 50000,
    category: "အစားအသောက်",
    accountId: "cash",
    date: "2026-06-25",
    note: "test",
  },
  {
    id: "TX-202",
    type: "Transfer",
    amount: 10000,
    category: "Transfer",
    accountId: "cash",
    toAccountId: "cbpay",
    date: "2026-06-25",
    note: "testing transfer",
  },
  {
    id: "TX-203",
    type: "Income",
    amount: 100000,
    category: "အထွေထွေ",
    accountId: "cash",
    date: "2026-06-25",
    note: "-",
  },
];

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "active-tasks" | "all-tasks" | "completed-tasks" | "habit-tracker">("dashboard");

  // Core States (loaded from localStorage or defaults)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [presets, setPresets] = useState<FocusPreset[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);

  // Selected date context for charts and lists
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 25)); // Jun 25, 2026
  const [selectedHabitMonth, setSelectedHabitMonth] = useState<number>(5); // June
  const [selectedHabitYear, setSelectedHabitYear] = useState<number>(2026);

  // Focus Timer States
  const [timerPreset, setTimerPreset] = useState<FocusPreset>({ id: "P-1001", name: "Learning", minutes: 25, icon: "📚" });
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);

  // Edit / Add Item States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedPresetToEdit, setSelectedPresetToEdit] = useState<FocusPreset | null>(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as "High" | "Medium" | "Low",
    status: "Pending" as "Pending" | "In Progress" | "Completed",
    dueDate: "2026-06-25",
  });

  const [accountForm, setAccountForm] = useState({
    name: "",
    balance: "",
    type: "Bank" as "Bank" | "Cash",
    icon: "CreditCard",
  });

  const [presetForm, setPresetForm] = useState({
    name: "",
    minutes: "25",
    icon: "💻",
  });

  const [habitForm, setHabitForm] = useState({
    name: "",
  });

  // Dynamic Transaction panel states (Picture 3, 4, 5 replication)
  const [txTab, setTxTab] = useState<"Expense" | "Income" | "Transfer">("Expense");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txCategory, setTxCategory] = useState<string>("အစားအသောက်");
  const [txAccount, setTxAccount] = useState<string>("cash");
  const [txToAccount, setTxToAccount] = useState<string>("cbpay");
  const [txDate, setTxDate] = useState<string>("2026-06-25");
  const [txNote, setTxNote] = useState<string>("");

  // Search/Filter states
  const [taskSearch, setTaskSearch] = useState("");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [miniTaskFilter, setMiniTaskFilter] = useState<"All" | "Active" | "Completed" | "Overdue">("All");

  // Notifications (Toasts)
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  // Custom Category States
  const [expenseCategories, setExpenseCategories] = useState<string[]>(["အစားအသောက်", "အဝတ်အထည်", "ခရီးသွားလာရေး", "ဖျော်ဖြေရေး", "အထွေထွေ"]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(["လစာ", "စီးပွားရေး", "အထွေထွေ"]);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [catModalTab, setCatModalTab] = useState<"Expense" | "Income">("Expense");
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  useEffect(() => {
    if (showCategoryModal) {
      setCatModalTab(txTab === "Income" ? "Income" : "Expense");
    }
  }, [showCategoryModal, txTab]);

  const saveExpenseCategoriesToLocal = (cats: string[]) => {
    setExpenseCategories(cats);
    localStorage.setItem("ws_expense_categories", JSON.stringify(cats));
  };

  const saveIncomeCategoriesToLocal = (cats: string[]) => {
    setIncomeCategories(cats);
    localStorage.setItem("ws_income_categories", JSON.stringify(cats));
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      addToast("ကျေးဇူးပြု၍ ခေါင်းစဉ်အမည်ထည့်သွင်းပါ", "error");
      return;
    }
    if (catModalTab === "Expense") {
      if (expenseCategories.includes(trimmed)) {
        addToast("ဤထွက်ငွေခေါင်းစဉ် ရှိပြီးသားဖြစ်သည်", "error");
        return;
      }
      const updated = [...expenseCategories, trimmed];
      saveExpenseCategoriesToLocal(updated);
      setTxCategory(trimmed);
    } else if (catModalTab === "Income") {
      if (incomeCategories.includes(trimmed)) {
        addToast("ဤဝင်ငွေခေါင်းစဉ် ရှိပြီးသားဖြစ်သည်", "error");
        return;
      }
      const updated = [...incomeCategories, trimmed];
      saveIncomeCategoriesToLocal(updated);
      setTxCategory(trimmed);
    }
    setNewCategoryName("");
    addToast("ခေါင်းစဉ်အသစ် ထည့်သွင်းပြီးပါပြီ");
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catModalTab === "Expense") {
      if (expenseCategories.length <= 1) {
        addToast("အနည်းဆုံး ခေါင်းစဉ်တစ်ခု ကျန်ရှိရပါမည်", "error");
        return;
      }
      const updated = expenseCategories.filter((c) => c !== catToDelete);
      saveExpenseCategoriesToLocal(updated);
      if (txCategory === catToDelete) {
        setTxCategory(updated[0]);
      }
    } else if (catModalTab === "Income") {
      if (incomeCategories.length <= 1) {
        addToast("အနည်းဆုံး ခေါင်းစဉ်တစ်ခု ကျန်ရှိရပါမည်", "error");
        return;
      }
      const updated = incomeCategories.filter((c) => c !== catToDelete);
      saveIncomeCategoriesToLocal(updated);
      if (txCategory === catToDelete) {
        setTxCategory(updated[0]);
      }
    }
    addToast("ခေါင်းစဉ်ကို ဖျက်လိုက်ပါပြီ", "info");
  };

  // Load state on mount
  useEffect(() => {
    // Expense Categories
    const localExpenseCats = localStorage.getItem("ws_expense_categories");
    if (localExpenseCats) {
      setExpenseCategories(JSON.parse(localExpenseCats));
    } else {
      localStorage.setItem("ws_expense_categories", JSON.stringify(["အစားအသောက်", "အဝတ်အထည်", "ခရီးသွားလာရေး", "ဖျော်ဖြေရေး", "အထွေထွေ"]));
    }

    // Income Categories
    const localIncomeCats = localStorage.getItem("ws_income_categories");
    if (localIncomeCats) {
      setIncomeCategories(JSON.parse(localIncomeCats));
    } else {
      localStorage.setItem("ws_income_categories", JSON.stringify(["လစာ", "စီးပွားရေး", "အထွေထွေ"]));
    }
    // Accounts
    const localAccounts = localStorage.getItem("ws_accounts");
    if (localAccounts) {
      setAccounts(JSON.parse(localAccounts));
    } else {
      setAccounts(defaultAccounts);
      localStorage.setItem("ws_accounts", JSON.stringify(defaultAccounts));
    }

    // Transactions
    const localTxs = localStorage.getItem("ws_transactions");
    if (localTxs) {
      setTransactions(JSON.parse(localTxs));
    } else {
      setTransactions(defaultTransactions);
      localStorage.setItem("ws_transactions", JSON.stringify(defaultTransactions));
    }

    // Tasks
    const localTasks = localStorage.getItem("ws_tasks");
    if (localTasks) {
      setTasks(JSON.parse(localTasks));
    } else {
      setTasks(defaultTasks);
      localStorage.setItem("ws_tasks", JSON.stringify(defaultTasks));
    }

    // Presets
    const localPresets = localStorage.getItem("ws_presets");
    if (localPresets) {
      setPresets(JSON.parse(localPresets));
    } else {
      setPresets(defaultPresets);
      localStorage.setItem("ws_presets", JSON.stringify(defaultPresets));
    }

    // Habits
    const localHabits = localStorage.getItem("ws_habits");
    if (localHabits) {
      setHabits(JSON.parse(localHabits));
    } else {
      setHabits(defaultHabits);
      localStorage.setItem("ws_habits", JSON.stringify(defaultHabits));
    }

    // Habit Logs
    const localLogs = localStorage.getItem("ws_habit_logs");
    if (localLogs) {
      setHabitLogs(JSON.parse(localLogs));
    } else {
      // Create some initial log checks for June 25, 2026
      const initialLogs: HabitLog[] = [
        { habitId: "H-1001", date: "2026-06-25", checked: true },
        { habitId: "H-1002", date: "2026-06-25", checked: true },
        { habitId: "H-1003", date: "2026-06-25", checked: true },
      ];
      setHabitLogs(initialLogs);
      localStorage.setItem("ws_habit_logs", JSON.stringify(initialLogs));
    }
  }, []);

  // Sync txAccount and txToAccount to ensure they are always valid
  useEffect(() => {
    if (accounts.length > 0) {
      const ids = accounts.map((a) => a.id);
      if (!txAccount || !ids.includes(txAccount)) {
        setTxAccount(accounts[0].id);
      }
      if (!txToAccount || !ids.includes(txToAccount)) {
        const remaining = accounts.filter((a) => a.id !== txAccount);
        if (remaining.length > 0) {
          setTxToAccount(remaining[0].id);
        } else {
          setTxToAccount(accounts[0].id);
        }
      }
    }
  }, [accounts, txAccount, txToAccount]);

  // Sync state helpers
  const saveAccountsToLocal = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    localStorage.setItem("ws_accounts", JSON.stringify(newAccounts));
  };

  const saveTransactionsToLocal = (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    localStorage.setItem("ws_transactions", JSON.stringify(newTxs));
  };

  const saveTasksToLocal = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("ws_tasks", JSON.stringify(newTasks));
  };

  const savePresetsToLocal = (newPresets: FocusPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem("ws_presets", JSON.stringify(newPresets));
  };

  const saveHabitsToLocal = (newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem("ws_habits", JSON.stringify(newHabits));
  };

  const saveHabitLogsToLocal = (newLogs: HabitLog[]) => {
    setHabitLogs(newLogs);
    localStorage.setItem("ws_habit_logs", JSON.stringify(newLogs));
  };

  // Toast notifier
  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Financial calculations
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalCash = accounts.filter((a) => a.type === "Cash").reduce((acc, a) => acc + a.balance, 0);
  const totalBank = accounts.filter((a) => a.type === "Bank").reduce((acc, a) => acc + a.balance, 0);

  // Month navigation for Transactions and Charts
  const handleMonthChange = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Filtered transactions for the currently selected month
  const filteredTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getFullYear() === currentDate.getFullYear() &&
      txDate.getMonth() === currentDate.getMonth()
    );
  });

  // Calculate Category Totals for Expense Chart
  const categoryColors = ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#a855f7"];

  const categoryTotals = expenseCategories.reduce((acc, cat) => {
    acc[cat] = filteredTxs
      .filter((tx) => tx.type === "Expense" && tx.category === cat)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalExpenseThisMonth = filteredTxs
    .filter((tx) => tx.type === "Expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Focus Timer Logic
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerRunning(false);
            addToast("Focus Session Finished! Great Work! 🎉", "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const selectPreset = (p: FocusPreset) => {
    setTimerPreset(p);
    setTimeLeft(p.minutes * 60);
    setTimerRunning(false);
  };

  const adjustTimerMinutes = (amount: number) => {
    setTimeLeft((prev) => {
      const currentMin = Math.floor(prev / 60);
      const newMin = Math.max(1, currentMin + amount);
      return newMin * 60;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Dynamic Transaction Add Handler (Pictures 3, 4, 5)
  const handleAddTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast("ကျေးဇူးပြု၍ ပမာဏကို မှန်ကန်စွာ ထည့်သွင်းပါ", "error");
      return;
    }

    // Balance validation for Expense/Transfer
    if (txTab === "Expense" || txTab === "Transfer") {
      const srcAcc = accounts.find((a) => a.id === txAccount);
      if (!srcAcc || srcAcc.balance < amount) {
        addToast(`အကောင့် ${srcAcc?.name || ""} တွင် လက်ကျန်ငွေ မလုံလောက်ပါ`, "error");
        return;
      }
    }

    if (txTab === "Transfer" && txAccount === txToAccount) {
      addToast("ငွေလွှဲမည့်အကောင့်နှင့် လက်ခံမည့်အကောင့် မတူညီရပါ", "error");
      return;
    }

    // Create Transaction
    const newTx: Transaction = {
      id: "TX-" + Date.now().toString().slice(-6),
      type: txTab,
      amount,
      category: txTab === "Transfer" ? "Transfer" : txCategory,
      accountId: txAccount,
      toAccountId: txTab === "Transfer" ? txToAccount : undefined,
      date: txDate,
      note: txNote || "-",
    };

    // Update Accounts
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === txAccount) {
        if (txTab === "Expense" || txTab === "Transfer") {
          return { ...acc, balance: acc.balance - amount };
        } else if (txTab === "Income") {
          return { ...acc, balance: acc.balance + amount };
        }
      }
      if (txTab === "Transfer" && acc.id === txToAccount) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    saveAccountsToLocal(updatedAccounts);
    saveTransactionsToLocal([...transactions, newTx]);

    // Reset Form
    setTxAmount("");
    setTxNote("");
    addToast("စာရင်းအသစ်ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ");
  };

  // Reversal rollback transaction delete (Requirement 2)
  const handleDeleteTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    // Perform rollback calculations
    const updatedAccounts = accounts.map((acc) => {
      // If it's source account
      if (acc.id === tx.accountId) {
        if (tx.type === "Expense" || tx.type === "Transfer") {
          return { ...acc, balance: acc.balance + tx.amount };
        } else if (tx.type === "Income") {
          return { ...acc, balance: acc.balance - tx.amount };
        }
      }
      // If it's destination account
      if (tx.type === "Transfer" && acc.id === tx.toAccountId) {
        return { ...acc, balance: acc.balance - tx.amount };
      }
      return acc;
    });

    saveAccountsToLocal(updatedAccounts);
    saveTransactionsToLocal(transactions.filter((t) => t.id !== txId));
    addToast("စာရင်းမှတ်တမ်းကို ဖျက်သိမ်းပြီး လက်ကျန်ငွေကို ပြန်လည်ညှိနှိုင်းပြီးပါပြီ", "info");
  };

  // Add Custom Account Card Form Submit
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(accountForm.balance);
    if (!accountForm.name.trim() || isNaN(balanceNum)) {
      addToast("ကျေးဇူးပြု၍ အချက်အလက်များ အားလုံးဖြည့်သွင်းပါ", "error");
      return;
    }

    const newAcc: Account = {
      id: "ACC-" + Date.now().toString().slice(-4),
      name: accountForm.name,
      balance: balanceNum,
      type: accountForm.type,
      icon: accountForm.icon,
    };

    saveAccountsToLocal([...accounts, newAcc]);
    setShowAccountModal(false);
    setAccountForm({ name: "", balance: "", type: "Bank", icon: "CreditCard" });
    addToast("အကောင့်အသစ်ကို ဖန်တီးပြီးပါပြီ");
  };

  // Delete Account
  const handleDeleteAccount = (id: string, name: string) => {
    if (accounts.length <= 1) {
      addToast("အနည်းဆုံး အကောင့်တစ်ခု ရှိရပါမည်။", "error");
      return;
    }
    const filtered = accounts.filter((ac) => ac.id !== id);
    saveAccountsToLocal(filtered);
    addToast(`"${name}" အကောင့်ကို ဖျက်ပြီးပါပြီ`, "info");
  };

  // Create Task Submit
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      addToast("ကျေးဇူးပြု၍ Task ခေါင်းစဉ် ထည့်သွင်းပါ", "error");
      return;
    }

    if (selectedTask) {
      // Edit existing
      const updated = tasks.map((t) => {
        if (t.id === selectedTask.id) {
          return {
            ...t,
            title: taskForm.title,
            description: taskForm.description,
            priority: taskForm.priority,
            status: taskForm.status,
            dueDate: taskForm.dueDate,
            completedDate: taskForm.status === "Completed" ? new Date().toISOString().split("T")[0] : undefined,
          };
        }
        return t;
      });
      saveTasksToLocal(updated);
      addToast("Task ကို ပြင်ဆင်ပြီးပါပြီ");
    } else {
      // Create new
      const newTask: Task = {
        id: "T-" + (1000 + tasks.length + 1),
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: taskForm.dueDate,
        createdDate: new Date().toISOString().split("T")[0],
        completedDate: taskForm.status === "Completed" ? new Date().toISOString().split("T")[0] : undefined,
      };
      saveTasksToLocal([...tasks, newTask]);
      addToast("Task အသစ် ထည့်သွင်းပြီးပါပြီ");
    }

    setShowTaskModal(false);
    setSelectedTask(null);
    setTaskForm({ title: "", description: "", priority: "Medium", status: "Pending", dueDate: "2026-06-25" });
  };

  // Open Task Modal for Create
  const openNewTaskModal = () => {
    setSelectedTask(null);
    setTaskForm({ title: "", description: "", priority: "Medium", status: "Pending", dueDate: "2026-06-25" });
    setShowTaskModal(true);
  };

  // Open Task Modal for Edit
  const openEditTaskModal = (task: Task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
    setShowTaskModal(true);
  };

  // Toggle Task Checklist Status
  const toggleTaskStatus = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const isCompleted = t.status === "Completed";
        return {
          ...t,
          status: (isCompleted ? "Pending" : "Completed") as any,
          completedDate: isCompleted ? undefined : new Date().toISOString().split("T")[0],
        };
      }
      return t;
    });
    saveTasksToLocal(updated);
    addToast("Task အခြေအနေကို ပြောင်းလဲလိုက်ပါပြီ");
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    saveTasksToLocal(tasks.filter((t) => t.id !== taskId));
    addToast("Task ကို ဖျက်လိုက်ပါပြီ", "info");
  };

  // Manage Focus Presets Form Submit (Picture 2 Modal style matching)
  const handlePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = parseInt(presetForm.minutes);
    if (!presetForm.name.trim() || isNaN(minVal) || minVal <= 0) {
      addToast("ကျေးဇူးပြု၍ အချက်အလက်များကို မှန်ကန်စွာ ထည့်သွင်းပါ", "error");
      return;
    }

    if (selectedPresetToEdit) {
      // Edit preset
      const updated = presets.map((p) => {
        if (p.id === selectedPresetToEdit.id) {
          return { ...p, name: presetForm.name, minutes: minVal, icon: presetForm.icon };
        }
        return p;
      });
      savePresetsToLocal(updated);
      addToast("Preset ကို ပြင်ဆင်ပြီးပါပြီ");
    } else {
      // Add new preset
      const newPreset: FocusPreset = {
        id: "P-" + Date.now().toString().slice(-4),
        name: presetForm.name,
        minutes: minVal,
        icon: presetForm.icon,
      };
      savePresetsToLocal([...presets, newPreset]);
      addToast("Focus Preset အသစ်ကို ထည့်သွင်းပြီးပါပြီ");
    }

    setShowPresetModal(false);
    setSelectedPresetToEdit(null);
    setPresetForm({ name: "", minutes: "25", icon: "💻" });
  };

  // Edit Focus Preset trigger
  const triggerEditPreset = (p: FocusPreset) => {
    setSelectedPresetToEdit(p);
    setPresetForm({ name: p.name, minutes: p.minutes.toString(), icon: p.icon });
    setShowPresetModal(true);
  };

  // Delete Focus Preset
  const handleDeletePreset = (id: string) => {
    savePresetsToLocal(presets.filter((p) => p.id !== id));
    addToast("Preset ကို ဖျက်လိုက်ပါပြီ", "info");
  };

  // Habit Logging toggle helper
  const toggleHabitCheck = (habitId: string, date: string) => {
    const existing = habitLogs.find((log) => log.habitId === habitId && log.date === date);
    let updated: HabitLog[];

    if (existing) {
      updated = habitLogs.map((log) => {
        if (log.habitId === habitId && log.date === date) {
          return { ...log, checked: !log.checked };
        }
        return log;
      });
    } else {
      updated = [...habitLogs, { habitId, date, checked: true }];
    }

    saveHabitLogsToLocal(updated);
    addToast("Habit logs updated successfully");
  };

  // Add Habit Form Submit
  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitForm.name.trim()) {
      addToast("ခေါင်းစဉ် ထည့်သွင်းပေးပါ", "error");
      return;
    }

    const newHabit: Habit = {
      id: "H-" + Date.now().toString().slice(-4),
      name: habitForm.name,
      createdDate: new Date().toISOString().split("T")[0],
    };

    saveHabitsToLocal([...habits, newHabit]);
    setShowHabitModal(false);
    setHabitForm({ name: "" });
    addToast("အလေ့အကျင့်အသစ်ကို ဖန်တီးပြီးပါပြီ");
  };

  // Delete Habit
  const handleDeleteHabit = (id: string) => {
    saveHabitsToLocal(habits.filter((h) => h.id !== id));
    saveHabitLogsToLocal(habitLogs.filter((log) => log.habitId !== id));
    addToast("အလေ့အကျင့်ကို ဖျက်သိမ်းပြီးပါပြီ", "info");
  };

  // Export to CSV Function
  const exportTransactionsToCSV = () => {
    const headers = "ID,Type,Amount (MMK),Category,Account,To Account,Date,Note\n";
    const rows = transactions
      .map((tx) => {
        const srcAcc = accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
        const destAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId)?.name : "";
        return `"${tx.id}","${tx.type}","${tx.amount}","${tx.category}","${srcAcc}","${destAcc}","${tx.date}","${tx.note}"`;
      })
      .join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Workspace_Transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Month select details for Habit Tracker Spreadsheet board
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const totalDaysInSelectedMonth = new Date(selectedHabitYear, selectedHabitMonth + 1, 0).getDate();

  // Tasks display filters
  const getFilteredTasks = (tabContext: "active" | "all" | "completed") => {
    let result = [...tasks];
    if (tabContext === "active") {
      result = result.filter((t) => t.status !== "Completed");
    } else if (tabContext === "completed") {
      result = result.filter((t) => t.status === "Completed");
    }

    // Additional filters for Search and Priority
    if (taskSearch.trim() !== "") {
      result = result.filter((t) => t.title.toLowerCase().includes(taskSearch.toLowerCase()));
    }
    if (taskPriorityFilter !== "All") {
      result = result.filter((t) => t.priority === taskPriorityFilter);
    }
    return result;
  };

  // Mini task checklist filter logic for dashboard card
  const getMiniTasks = () => {
    let result = [...tasks];
    const todayStr = new Date().toISOString().split("T")[0];
    if (miniTaskFilter === "Active") {
      result = result.filter((t) => t.status !== "Completed");
    } else if (miniTaskFilter === "Completed") {
      result = result.filter((t) => t.status === "Completed");
    } else if (miniTaskFilter === "Overdue") {
      result = result.filter((t) => t.status !== "Completed" && t.dueDate < todayStr);
    }
    return result;
  };

  // Account Type Icons
  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case "Smartphone":
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case "Coins":
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case "Wallet":
        return <Wallet className="w-4 h-4 text-indigo-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Toast Wrapper */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-white text-slate-800 px-4 py-3 rounded-xl border border-slate-200 shadow-xl pointer-events-auto min-w-[280px] animate-fade-in"
          >
            <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Styled Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white py-4 px-6 border-b-4 border-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/40">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                Workspace Suite <span className="text-indigo-400 text-xs py-0.5 px-2 bg-slate-950/60 rounded-full border border-slate-700/30 font-medium">All-in-One</span>
              </h1>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5">
                Tasks, Habits & Spending Cash Flow Manager
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex flex-wrap gap-1 bg-slate-950/40 p-1.5 rounded-xl border border-slate-700/30">
            {[
              { id: "dashboard", label: "Dashboard", icon: <Award className="w-4 h-4" /> },
              { id: "active-tasks", label: "Active Tasks", icon: <ListTodo className="w-4 h-4" /> },
              { id: "all-tasks", label: "All Tasks", icon: <Search className="w-4 h-4" /> },
              { id: "completed-tasks", label: "Completed", icon: <CheckCircle className="w-4 h-4" /> },
              { id: "habit-tracker", label: "Habits Board", icon: <Calendar className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md border border-indigo-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* ======================= DASHBOARD TAB VIEW ======================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Executive Control System</h2>
                <p className="text-xs text-slate-500">Monitor active accounts, log transactions, and schedule workloads.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportTransactionsToCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>စာရင်းထုတ်ယူရန် (CSV)</span>
                </button>
                <button
                  onClick={openNewTaskModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Task</span>
                </button>
              </div>
            </div>

            {/* Dashboard Mini Widgets row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Account Balance Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Balance</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {totalBalance.toLocaleString()} <span className="text-sm font-bold text-slate-500">MMK</span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-amber-500" /> Cash: {totalCash.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Bank: {totalBank.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                  <Wallet className="w-6 h-6 text-indigo-700" />
                </div>
              </div>

              {/* Today Focus Timer Widget Stat */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Focus Session</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {timerPreset.minutes} <span className="text-sm font-bold text-slate-500">Mins</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Active Template: {timerPreset.icon} {timerPreset.name}
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>

              {/* Habits stats */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Habits Rate</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {habits.length > 0 ? "100%" : "0%"}
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" /> Tracked Habits: {habits.length} Records
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>

            </div>

            {/* Main Columns Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Account Cards & Quick Add Transaction (Picture 3, 4, 5 style) */}
              <div className="space-y-6">
                
                {/* Account Cards */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Account Cards</span>
                    </h3>
                    <button
                      onClick={() => setShowAccountModal(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer"
                    >
                      + New Account
                    </button>
                  </div>

                  <div className="space-y-2">
                    {accounts.map((ac) => (
                      <div
                        key={ac.id}
                        className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100/50 flex items-center justify-center">
                            {getAccountIcon(ac.icon)}
                          </div>
                          <span className="text-xs font-extrabold text-slate-800">{ac.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-600">{ac.balance.toLocaleString()} MMK</span>
                          <button
                            onClick={() => handleDeleteAccount(ac.id, ac.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="အကောင့်ဖျက်ရန်"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Replicated Сard: Add New with tabs (Matches Picture 3, 4, 5 beautifully) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">စာရင်းအသစ်ထည့်သွင်းရန်</h3>
                  </div>

                  {/* Transaction Action Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setTxTab("Expense");
                        setTxCategory(expenseCategories[0] || "အစားအသောက်");
                      }}
                      className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        txTab === "Expense"
                          ? "bg-white text-rose-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span className="text-rose-500 text-xs">⛔</span>
                      <span>ထွက်ငွေ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxTab("Income");
                        setTxCategory(incomeCategories[0] || "လစာ");
                      }}
                      className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        txTab === "Income"
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span className="text-emerald-500 text-xs">➕</span>
                      <span>ဝင်ငွေ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTxTab("Transfer");
                      }}
                      className={`py-2 px-1 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        txTab === "Transfer"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span className="text-blue-500 text-xs">⇆</span>
                      <span>ငွေလွှဲရန်</span>
                    </button>
                  </div>

                  {/* Transaction Add Form */}
                  <form onSubmit={handleAddTransactionSubmit} className="space-y-3.5">
                    
                    {/* Amount Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">ပမာဏ (MMK)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="MMK ဥပမာ- ၅၀၀၀"
                          required
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Category Selector (Expense vs Income, none for Transfer) */}
                    {txTab !== "Transfer" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">ခေါင်းစဉ်အုပ်စု</label>
                        <div className="flex gap-2">
                          <select
                            value={txCategory}
                            onChange={(e) => setTxCategory(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          >
                            {txTab === "Expense" ? (
                              expenseCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))
                            ) : (
                              incomeCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))
                            )}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowCategoryModal(true)}
                            className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 hover:bg-indigo-100 transition-all flex items-center justify-center cursor-pointer"
                            title="ခေါင်းစဉ်အုပ်စုများ စီမံရန်"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Account Cards Selector Dropdown (Replaces old static hardcoded values. Requirement 5) */}
                    {txTab === "Expense" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">ပေးချေမည့်အကောင့် (Account)</label>
                        <div className="flex gap-2">
                          <select
                            value={txAccount}
                            onChange={(e) => setTxAccount(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          >
                            {accounts.map((ac) => (
                              <option key={ac.id} value={ac.id}>
                                {ac.name} ({ac.balance.toLocaleString()} MMK)
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowAccountModal(true)}
                            className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 hover:bg-indigo-100 transition-all flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {txTab === "Income" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">လက်ခံမည့်အကောင့် (Account)</label>
                        <div className="flex gap-2">
                          <select
                            value={txAccount}
                            onChange={(e) => setTxAccount(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          >
                            {accounts.map((ac) => (
                              <option key={ac.id} value={ac.id}>
                                {ac.name} ({ac.balance.toLocaleString()} MMK)
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowAccountModal(true)}
                            className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 hover:bg-indigo-100 transition-all flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {txTab === "Transfer" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 block">ငွေထုတ်မည့်အကောင့်</label>
                          <select
                            value={txAccount}
                            onChange={(e) => setTxAccount(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                          >
                            {accounts.map((ac) => (
                              <option key={ac.id} value={ac.id}>
                                {ac.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 block">ငွေလက်ခံမည့်အကောင့်</label>
                          <select
                            value={txToAccount}
                            onChange={(e) => setTxToAccount(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                          >
                            {accounts.map((ac) => (
                              <option key={ac.id} value={ac.id}>
                                {ac.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Date Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">ရက်စွဲ</label>
                      <input
                        type="date"
                        required
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* Note Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">အကြောင်းအရာအကျဉ်း</label>
                      <input
                        type="text"
                        placeholder="ဥပမာ- KBZ Pay သို့ လွှဲပြောင်းသည်"
                        value={txNote}
                        onChange={(e) => setTxNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* Submit Register button */}
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>စာရင်းသွင်းရန်</span>
                    </button>

                  </form>
                </div>

              </div>

              {/* Middle Column: Active checklist mini list with filters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-indigo-600" />
                      <span>Statistics & Tasks</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("all-tasks")}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      View All
                    </button>
                  </div>

                  {/* Mini filters summary counting badges */}
                  <div className="grid grid-cols-4 gap-1.5 text-center mb-4">
                    {[
                      { key: "All", label: "ALL", color: "text-slate-500", count: tasks.length },
                      { key: "Active", label: "ACTIVE", color: "text-blue-600", count: tasks.filter((t) => t.status !== "Completed").length },
                      { key: "Completed", label: "DONE", color: "text-indigo-600", count: tasks.filter((t) => t.status === "Completed").length },
                      { key: "Overdue", label: "OVERDUE", color: "text-rose-600", count: tasks.filter((t) => t.status !== "Completed" && t.dueDate < "2026-06-25").length },
                    ].map((filt) => (
                      <button
                        key={filt.key}
                        type="button"
                        onClick={() => setMiniTaskFilter(filt.key as any)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          miniTaskFilter === filt.key
                            ? "border-indigo-600 bg-indigo-50/50"
                            : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`block text-[8px] font-black tracking-wider ${filt.color}`}>{filt.label}</span>
                        <span className="text-sm font-black text-slate-800">{filt.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mini List */}
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {getMiniTasks().length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">
                        အခြေအနေကိုက်ညီသော task မရှိသေးပါ
                      </div>
                    ) : (
                      getMiniTasks().map((task) => (
                        <div
                          key={task.id}
                          className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleTaskStatus(task.id)}
                              className="text-slate-400 hover:text-indigo-600 transition-all shrink-0 cursor-pointer"
                            >
                              {task.status === "Completed" ? (
                                <CheckCircle className="w-5 h-5 text-indigo-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                              )}
                            </button>
                            <span
                              className={`text-xs font-bold leading-tight ${
                                task.status === "Completed" ? "line-through text-slate-400" : "text-slate-800"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                              task.priority === "High"
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : task.priority === "Medium"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openNewTaskModal}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-200/60 transition-all cursor-pointer mt-4"
                >
                  + Add New Task
                </button>
              </div>

              {/* Right Column: Habits Checklist Mini with orange ticks */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-500" />
                      <span>Habit Tracker Checklist</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("habit-tracker")}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      View Logs
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mb-3">Today logs (2026-06-25):</p>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {habits.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">
                        အလေ့အကျင့် မရှိသေးပါ။ အောက်တွင် အသစ်ထည့်ပါ
                      </div>
                    ) : (
                      habits.map((h) => {
                        const logged = habitLogs.some((l) => l.habitId === h.id && l.date === "2026-06-25" && l.checked);
                        return (
                          <div
                            key={h.id}
                            className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all"
                          >
                            <span className="text-xs font-black text-slate-800">{h.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleHabitCheck(h.id, "2026-06-25")}
                              className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                logged
                                  ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                                  : "border-slate-300 bg-white text-transparent hover:border-orange-400"
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHabitModal(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl border border-slate-200/60 transition-all cursor-pointer mt-4"
                >
                  + Create Habit
                </button>
              </div>

            </div>

            {/* Third Row: Distribution & Spend Category charts side-by-side (Requirement 4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Workload Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="p-1 bg-teal-50 border border-teal-100 rounded text-teal-700">📊</span>
                  <span>Workload Distribution</span>
                </h3>

                <div className="flex flex-col items-center justify-center py-2 relative h-56">
                  {/* SVG Pie Chart */}
                  <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                    {/* High priority */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * 0.7}`}
                      strokeLinecap="round"
                    />
                    {/* Medium priority */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * 0.9}`}
                      className="origin-center rotate-45"
                    />
                  </svg>

                  {/* Chart Legends */}
                  <div className="flex gap-4 text-[10px] font-black text-slate-600 mt-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> High ({tasks.filter((t) => t.priority === "High").length})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium ({tasks.filter((t) => t.priority === "Medium").length})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400" /> Low ({tasks.filter((t) => t.priority === "Low").length})
                    </span>
                  </div>
                </div>
              </div>

              {/* Rebuilt Expense analysis chart: "ထွက်ငွေ ဆန်းစစ်ချက် (အုပ်စုအလိုက်)" with perfect clean empty state (Requirement 1 & 4) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="p-1 bg-amber-50 border border-amber-100 rounded text-amber-700">💰</span>
                    <span>ထွက်ငွေ ဆန်းစစ်ချက် (အုပ်စုအလိုက်)</span>
                  </h3>
                  
                  {/* Month navigation */}
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => handleMonthChange("prev")}
                      className="p-1 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-600 font-extrabold min-w-[70px] text-center uppercase tracking-wider">
                      {monthNames[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMonthChange("next")}
                      className="p-1 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center relative h-56">
                  {totalExpenseThisMonth === 0 ? (
                    /* Beautiful Tidy Empty State (Addresses "မသေမသပ်ဖြစ်နေတာကိုလည်း ပြင်ပေး" in Requirement 1) */
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 rounded-2xl bg-slate-50/30 border border-dashed border-slate-200/80">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center shadow-sm">
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">
                          ဤလအတွင်း သုံးစွဲထားသော ထွက်ငွေစာရင်း မရှိသေးပါ
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ခေါင်းစဉ်အလိုက် နှိုင်းယှဉ်ချက်ဇယား ပြသရန် ထွက်ငွေစာရင်းများ ထည့်သွင်းပါ
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Gorgeous SVG Doughnut Chart */
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                          {/* Dynamically calculated segments */}
                          {(() => {
                            let accumulatedPercent = 0;
                            return Object.entries(categoryTotals).map(([cat, amountVal], idx) => {
                              const amount = amountVal as number;
                              if (amount === 0) return null;
                              const percent = amount / totalExpenseThisMonth;
                              const strokeDash = 2 * Math.PI * 40;
                              const strokeOffset = strokeDash * (1 - percent);
                              const rotation = accumulatedPercent * 360;
                              accumulatedPercent += percent;

                              return (
                                <circle
                                  key={cat}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  stroke={categoryColors[idx % categoryColors.length]}
                                  strokeWidth="12"
                                  strokeDasharray={`${strokeDash}`}
                                  strokeDashoffset={`${strokeOffset}`}
                                  style={{
                                    transformOrigin: "center",
                                    transform: `rotate(${rotation}deg)`,
                                  }}
                                  className="transition-all duration-500"
                                />
                              );
                            });
                          })()}
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Total</span>
                          <span className="text-xs font-black text-slate-800">{totalExpenseThisMonth.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-black text-slate-600">
                        {Object.entries(categoryTotals).map(([cat, rawVal], idx) => {
                          const val = rawVal as number;
                          if (val === 0) return null;
                          return (
                            <div key={cat} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: categoryColors[idx % categoryColors.length] }}
                              />
                              <span className="truncate">{cat} ({Math.round((val / totalExpenseThisMonth) * 100)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Monthly cash flow summary table with date filter & delete actioning (Requirement 2 & 3) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="p-1 bg-amber-50 border border-amber-100 rounded text-amber-700">📅</span>
                    <span>MONTHLY CASH FLOW SUMMARY</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Manage and audit logged income and expenditures.</p>
                </div>

                {/* Month navigation controls (Requirement 3) */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
                  <button
                    onClick={() => handleMonthChange("prev")}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-slate-800 min-w-[100px] text-center tracking-tight">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button
                    onClick={() => handleMonthChange("next")}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Note</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTxs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-medium">
                          ဤလအတွင်း စာရင်းသွင်းထားသော ငွေစာရင်းမှတ်တမ်း မရှိသေးပါ
                        </td>
                      </tr>
                    ) : (
                      [...filteredTxs].reverse().map((tx) => {
                        const srcAccName = accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
                        const destAccName = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId)?.name : "";
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-all text-xs">
                            <td className="py-3 px-4 font-extrabold">
                              {tx.type === "Expense" ? (
                                <span className="bg-rose-50 text-rose-600 py-1 px-2 rounded-lg border border-rose-100">ထွက်ငွေ</span>
                              ) : tx.type === "Income" ? (
                                <span className="bg-emerald-50 text-emerald-600 py-1 px-2 rounded-lg border border-emerald-100">ဝင်ငွေ</span>
                              ) : (
                                <span className="bg-blue-50 text-blue-600 py-1 px-2 rounded-lg border border-blue-100">ငွေလွှဲ</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-semibold">{tx.date}</td>
                            <td className="py-3 px-4 font-black text-slate-700">
                              {tx.type === "Transfer" ? (
                                <span className="flex items-center gap-1">
                                  {srcAccName} <ArrowLeftRight className="w-3 h-3 text-slate-400" /> {destAccName}
                                </span>
                              ) : (
                                srcAccName
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-extrabold">{tx.category}</td>
                            <td className="py-3 px-4 text-slate-400 max-w-[150px] truncate">{tx.note}</td>
                            <td className={`py-3 px-4 font-black ${
                              tx.type === "Expense" ? "text-rose-600" : tx.type === "Income" ? "text-emerald-600" : "text-blue-600"
                            }`}>
                              {tx.type === "Expense" ? "-" : ""}{tx.amount.toLocaleString()} MMK
                            </td>
                            <td className="py-3 px-4 text-center">
                              {/* Rollback Delete Button */}
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1 text-slate-300 hover:text-rose-600 transition-all cursor-pointer inline-flex items-center justify-center"
                                title="စာရင်းအား ဖျက်သိမ်းပြီး လက်ကျန်ငွေ ပြန်ညှိမည်"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FOCUS TIMER WORKSPACE WIDGET - Beautifully aligned and functional (Requirement 1 & 5) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-600 text-lg">⚡</span>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                    Focus Session Workspace Widget
                  </h3>
                </div>

                {/* PRO badge removed as requested: "ပြီးတော့ ဘေးနားက pro ဆိုတာကို ဖြုတ်" (Requirement 1) */}
                <div className="flex items-center gap-2">
                  {/* Manage Presets is fully functional. Clicking this triggers preset setup modal. */}
                  <button
                    onClick={() => {
                      setSelectedPresetToEdit(null);
                      setPresetForm({ name: "", minutes: "25", icon: "💻" });
                      setShowPresetModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-[#074a30] text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Manage Presets
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Presets Grid - Fully expanded cleanly, no vertical scrollbars as in Picture 2 */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Select focus template:</p>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    {presets.map((p) => {
                      const isActive = timerPreset.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => selectPreset(p)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative group ${
                            isActive
                              ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                              : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          {/* Mini Edit/Delete Presets Controls */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerEditPreset(p);
                              }}
                              className="p-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-emerald-700"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePreset(p.id);
                              }}
                              className="p-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-rose-700"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <span className="text-2xl mb-1.5 block">{p.icon}</span>
                          <span className="text-xs font-black text-slate-800 block truncate max-w-full">{p.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 block mt-0.5">{p.minutes} Min</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Circular timer count display area */}
                <div className="flex flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-slate-100 space-y-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - timeLeft / (timerPreset.minutes * 60))}`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>

                    <div className="absolute text-center space-y-0.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tight block">
                        {formatTime(timeLeft)}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">
                        Remaining
                      </span>
                    </div>
                  </div>

                  {/* Timer Controls with plus/minus increments */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => adjustTimerMinutes(-1)}
                      className="p-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
                      title="Decrease 1 Minute"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                        timerRunning
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      <span>{timerRunning ? "Pause" : "Start"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setTimeLeft(timerPreset.minutes * 60);
                      }}
                      className="px-3 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl transition-all cursor-pointer"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => adjustTimerMinutes(1)}
                      className="p-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
                      title="Increase 1 Minute"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mode Info tag */}
                  <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                    <span className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">Mode: Focus Session</span>
                    <span className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">Preset: {timerPreset.icon} {timerPreset.name}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ======================= ACTIVE TASKS TAB VIEW ======================= */}
        {activeTab === "active-tasks" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Active Tasks (In Progress / Pending)</h2>
                <p className="text-xs text-slate-500">Manage ongoing tasks and schedule timelines.</p>
              </div>
              <button
                onClick={openNewTaskModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#074a30] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getFilteredTasks("active").length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                        အလုပ်လုပ်ဆဲ task မရှိသေးပါ
                      </td>
                    </tr>
                  ) : (
                    getFilteredTasks("active").map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-all text-xs">
                        <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{task.id}</span></td>
                        <td className="py-3 px-4 font-extrabold text-slate-800">{task.title}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            task.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>{task.priority}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{task.dueDate}</td>
                        <td className="py-3 px-4">
                          <span className="bg-sky-50 text-sky-700 py-1 px-2 rounded-lg border border-sky-100 font-black">{task.status}</span>
                        </td>
                        <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                            title="Complete Task"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="p-1 text-slate-300 hover:text-blue-600 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= ALL TASKS TAB VIEW ======================= */}
        {activeTab === "all-tasks" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">All Tasks Registry</h2>
                <p className="text-xs text-slate-500">Search, filter, and audit entire corporate project logs.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getFilteredTasks("all").length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                        Task ရှာမတွေ့ပါ
                      </td>
                    </tr>
                  ) : (
                    getFilteredTasks("all").map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-all text-xs">
                        <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{task.id}</span></td>
                        <td className="py-3 px-4 font-extrabold text-slate-800">{task.title}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            task.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>{task.priority}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`py-1 px-2 rounded-lg border text-[10px] font-black ${
                            task.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>{task.status}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{task.dueDate}</td>
                        <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                            title="Complete Task"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="p-1 text-slate-300 hover:text-blue-600 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= COMPLETED TASKS VIEW ======================= */}
        {activeTab === "completed-tasks" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Completed Tasks History</h2>
              <p className="text-xs text-slate-500">View finished benchmarks and performance records.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Completed Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getFilteredTasks("completed").length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                        ပြီးမြောက်ပြီးသော task မရှိသေးပါ
                      </td>
                    </tr>
                  ) : (
                    getFilteredTasks("completed").map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-all text-xs">
                        <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{task.id}</span></td>
                        <td className="py-3 px-4 font-extrabold text-slate-400 line-through">{task.title}</td>
                        <td className="py-3 px-4"><span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded">{task.priority}</span></td>
                        <td className="py-3 px-4 text-slate-400 font-semibold">{task.createdDate}</td>
                        <td className="py-3 px-4 text-slate-500 font-extrabold">{task.completedDate || "-"}</td>
                        <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                            title="Mark as Incomplete"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================= HABIT TRACKER SPREADSHEET BOARD ======================= */}
        {activeTab === "habit-tracker" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Habit Tracker Spreadsheet board</h2>
                <p className="text-xs text-slate-500">Record daily achievements. View weeks of progress patterned to standard spreadsheet sheets.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedHabitMonth}
                  onChange={(e) => setSelectedHabitMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedHabitYear}
                  onChange={(e) => setSelectedHabitYear(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowHabitModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  + New Habit
                </button>
              </div>
            </div>

            {/* Spreadsheet Table Grid Container */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  {/* Row 1: Week headings */}
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                    <th className="py-2 px-3 border-r border-slate-200 text-left min-w-[150px] bg-slate-100 sticky left-0 z-10">
                      Daily Habits
                    </th>
                    <th className="py-2 px-3 border-r border-slate-200 min-w-[100px] bg-slate-100">
                      Completion
                    </th>
                    <th colSpan={7} className="border-r border-slate-200 bg-sky-50/50 text-sky-800">Week 1</th>
                    <th colSpan={7} className="border-r border-slate-200 bg-emerald-50/50 text-emerald-800">Week 2</th>
                    <th colSpan={7} className="border-r border-slate-200 bg-indigo-50/50 text-indigo-800">Week 3</th>
                    <th colSpan={7} className="border-r border-slate-200 bg-amber-50/50 text-amber-800">Week 4</th>
                    {totalDaysInSelectedMonth > 28 && (
                      <th colSpan={totalDaysInSelectedMonth - 28} className="bg-slate-50 text-slate-700">Week 5</th>
                    )}
                  </tr>

                  {/* Row 2: Days numbers */}
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 text-center">
                    <th className="py-1.5 px-3 border-r border-slate-200 text-left bg-slate-50 sticky left-0 z-10">Day So Far</th>
                    <th className="py-1.5 px-3 border-r border-slate-200 bg-slate-50">Total Complete</th>
                    {Array.from({ length: totalDaysInSelectedMonth }).map((_, i) => (
                      <th key={i} className="py-1.5 border-r border-slate-200 font-mono text-[9px] min-w-[24px]">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {habits.length === 0 ? (
                    <tr>
                      <td colSpan={totalDaysInSelectedMonth + 2} className="py-8 text-center text-xs text-slate-400">
                        အလေ့အကျင့် မရှိသေးပါ။ အထက်တွင် အသစ်ထည့်ပါ
                      </td>
                    </tr>
                  ) : (
                    habits.map((habit) => {
                      // Filter checks of this specific month
                      const logDatesInMonth = habitLogs.filter((log) => {
                        if (log.habitId !== habit.id || !log.checked) return false;
                        const logDate = new Date(log.date);
                        return (
                          logDate.getFullYear() === selectedHabitYear &&
                          logDate.getMonth() === selectedHabitMonth
                        );
                      });

                      return (
                        <tr key={habit.id} className="hover:bg-slate-50/40 text-xs">
                          {/* Habit Title Column (Sticky left) */}
                          <td className="py-2.5 px-3 border-r border-slate-100 bg-white sticky left-0 z-10 shadow-sm font-black text-slate-800 flex items-center justify-between min-w-[150px]">
                            <span className="truncate">{habit.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="p-1 text-slate-300 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete Habit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                          {/* Completion count */}
                          <td className="py-2.5 px-3 border-r border-slate-100 text-center font-extrabold text-slate-600 bg-slate-50/50">
                            {logDatesInMonth.length} / {totalDaysInSelectedMonth} Days
                          </td>

                          {/* Days Grid cell checkboxes */}
                          {Array.from({ length: totalDaysInSelectedMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const cellDate = `${selectedHabitYear}-${(selectedHabitMonth + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
                            const isChecked = habitLogs.some((l) => l.habitId === habit.id && l.date === cellDate && l.checked);

                            return (
                              <td key={i} className="py-2 border-r border-slate-100 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleHabitCheck(habit.id, cellDate)}
                                  className={`w-4 h-4 mx-auto rounded transition-all cursor-pointer border ${
                                    isChecked
                                      ? "bg-orange-500 border-orange-500 text-white"
                                      : "border-slate-200 bg-white hover:border-orange-400"
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3.5] mx-auto" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Extra summary instruction */}
            <p className="text-[10px] text-slate-400 font-medium italic text-right">
              * Spreadsheet board checks are synced in real-time. Change the selectors to view previous dates.
            </p>
          </div>
        )}

      </main>

      {/* Floating Plus button for speed Expense logging */}
      <button
        onClick={() => {
          setTxTab("Expense");
          setTxCategory("အစားအသောက်");
          setTxAmount("");
          setTxNote("");
          // Scroll dashboard to quick form
          window.scrollTo({ top: 100, behavior: "smooth" });
          addToast("စတင်မှတ်တမ်းတင်ရန် အသုံးစရိတ် Form သို့ ရောက်ရှိပါပြီ", "info");
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-emerald-700 transition-all transform hover:scale-110 cursor-pointer z-40 border border-emerald-500/30"
        title="Quick Transaction"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 mt-12 space-y-1">
        <p className="font-extrabold text-slate-700">© 2026 Workspace Suite All-in-One Executive Dashboard.</p>
        <p className="font-semibold text-slate-400">လူကြီးမင်း၏ ဒေတာများအားလုံးကို Browser LocalStorage တွင် လုံခြုံစွာ Live သိမ်းဆည်းပေးထားပါသည်။</p>
      </footer>

      {/* ================================== MODALS ================================== */}

      {/* 1. TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {selectedTask ? `Edit Task: ${selectedTask.id}` : "Add Workspace Task"}
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Submit project proposal"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Description / Details</label>
                <textarea
                  placeholder="Specify deliverables, links, details..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Priority Level</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Current Status</label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#074a30] hover:bg-[#0a5c3c] text-white text-xs font-bold rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ACCOUNT MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                အကောင့်အသစ်ထည့်သွင်းရန်
              </h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">အကောင့်အမည် *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CB Pay, KBZ Pay, Wave"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">စတင်လက်ကျန်ငွေ *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">အကောင့်အမျိုးအစား</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Bank">Bank / Mobile Wallet</option>
                    <option value="Cash">Physical Cash</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">အိုင်ကွန်ပုံစံ</label>
                  <select
                    value={accountForm.icon}
                    onChange={(e) => setAccountForm({ ...accountForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="CreditCard">Credit Card</option>
                    <option value="Smartphone">Mobile App</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Coins">Cash Bag</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#074a30] hover:bg-[#0a5c3c] text-white text-xs font-bold rounded-xl"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.5 CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                ခေါင်းစဉ်အုပ်စုများ စီမံရန်
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCatModalTab("Expense")}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  catModalTab === "Expense"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ⛔ ထွက်ငွေခေါင်းစဉ်
              </button>
              <button
                type="button"
                onClick={() => setCatModalTab("Income")}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  catModalTab === "Income"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ➕ ဝင်ငွေခေါင်းစဉ်
              </button>
            </div>

            {/* List of current categories */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                လက်ရှိ ခေါင်းစဉ်များ
              </label>
              {(catModalTab === "Expense" ? expenseCategories : incomeCategories).map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-all"
                >
                  <span className="text-xs font-semibold text-slate-800">{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    title="ခေါင်းစဉ်ကို ဖျက်ရန်"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new category form */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                ခေါင်းစဉ်အသစ် ထည့်သွင်းရန်
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. လက်ဆောင်"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  ပေါင်းထည့်မည်
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                ပိတ်မည် (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FOCUS PRESET MODAL - Picture 2 replication */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-[#074a30] uppercase tracking-tight">
                {selectedPresetToEdit ? `Edit Preset: ${selectedPresetToEdit.name}` : "Create Focus Preset"}
              </h3>
              <button onClick={() => setShowPresetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePresetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Preset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Work"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={180}
                    placeholder="25"
                    value={presetForm.minutes}
                    onChange={(e) => setPresetForm({ ...presetForm, minutes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Icon (Emoji/Char) *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={presetForm.icon}
                    onChange={(e) => setPresetForm({ ...presetForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {selectedPresetToEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeletePreset(selectedPresetToEdit.id);
                      setShowPresetModal(false);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl mr-auto"
                  >
                    Delete Preset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPresetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#074a30] hover:bg-[#0a5c3c] text-white text-xs font-bold rounded-xl"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. HABIT MODAL */}
      {showHabitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                အလေ့အကျင့်အသစ်ထည့်ရန်
              </h3>
              <button onClick={() => setShowHabitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHabitSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">အလေ့အကျင့်အမည် *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gym, Reading, Code..."
                  value={habitForm.name}
                  onChange={(e) => setHabitForm({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowHabitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#074a30] hover:bg-[#0a5c3c] text-white text-xs font-bold rounded-xl"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
