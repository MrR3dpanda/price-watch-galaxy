import { useState, useEffect, useRef } from 'react';
import DarkModeToggle from './DarkModeToggle';
import SearchAndSort from './SearchAndSort';

interface PriceItem {
  id: string;
  name: string;
  previousPrice: number;
  currentPrice: number;
  category: string;
  createdAt: string;
  targetPurchase?: number;
  lastPrice?: number; // Add last price tracking
}

interface ItemHistory {
  name: string;
  category: string;
  lastPrice: number;
  lastUpdated: string;
}

interface DailyPriceList {
  date: string;
  items: PriceItem[];
}

const PriceComparisonApp = () => {
  const [dailyLists, setDailyLists] = useState<DailyPriceList[]>([]);
  const [itemHistory, setItemHistory] = useState<ItemHistory[]>([]);
  const [name, setName] = useState('');
  const [previousPrice, setPreviousPrice] = useState('');
  const [category, setCategory] = useState('');
  const [targetPurchase, setTargetPurchase] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'difference'>('name');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const savedDailyLists = localStorage.getItem('dailyPriceLists');
    const savedItemHistory = localStorage.getItem('itemHistory');

    if (savedDailyLists) {
      setDailyLists(JSON.parse(savedDailyLists));
    }
    if (savedItemHistory) {
      setItemHistory(JSON.parse(savedItemHistory));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setEditingItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyPriceLists', JSON.stringify(dailyLists));
    localStorage.setItem('itemHistory', JSON.stringify(itemHistory));
  }, [dailyLists, itemHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !previousPrice) {
      setError('Please fill in all required fields');
      return;
    }

    const priceValue = parseFloat(previousPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid positive price');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayList = dailyLists.find(list => list.date === today);

    console.log('Current dailyLists:', dailyLists);
    console.log('Today:', today);
    console.log('Today list:', todayList);

    if (!editingItem && todayList?.items.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      setError('An item with this name already exists');
      return;
    }

    const newItem: PriceItem = {
      id: Date.now().toString(),
      name,
      previousPrice: priceValue,
      currentPrice: priceValue,
      category,
      createdAt: today,
      targetPurchase: targetPurchase ? parseFloat(targetPurchase) : undefined,
    };

    console.log('New item:', newItem);

    if (editingItem) {
      setDailyLists(prev => {
        console.log('Editing existing item');
        return prev.map(list => {
          if (list.date === today) {
            return {
              ...list,
              items: list.items.map(item =>
                item.id === editingItem.id ? { ...newItem, id: item.id } : item
              )
            };
          }
          return list;
        });
      });
    } else {
      setDailyLists(prev => {
        console.log('Adding new item');
        const existingListIndex = prev.findIndex(list => list.date === today);
        if (existingListIndex !== -1) {
          const updatedLists = [...prev];
          updatedLists[existingListIndex] = {
            ...updatedLists[existingListIndex],
            items: [...updatedLists[existingListIndex].items, newItem]
          };
          console.log('Updated lists:', updatedLists);
          return updatedLists;
        } else {
          const newLists = [...prev, { date: today, items: [newItem] }];
          console.log('New lists:', newLists);
          return newLists;
        }
      });
    }

    setName('');
    setPreviousPrice('');
    setCategory('');
    setTargetPurchase('');
    setError('');
    setIsDropdownOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (item: PriceItem) => {
    setEditingItem(item);
    setName(item.name);
    setPreviousPrice(item.previousPrice.toString());
    setCategory(item.category);
    setTargetPurchase(item.targetPurchase?.toString() || '');
    setIsDropdownOpen(true);
  };

  const handleDelete = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setDailyLists(prev => prev.map(list => {
      if (list.date === today) {
        return {
          ...list,
          items: list.items.filter(item => item.id !== id)
        };
      }
      return list;
    }));
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    const today = new Date().toISOString().split('T')[0];
    setDailyLists(prev => prev.map(list => {
      if (list.date === today) {
        return {
          ...list,
          items: list.items.map(item => {
            if (item.id === id) {
              // Update item history when price changes
              setItemHistory(prevHistory => {
                const existing = prevHistory.find(h => h.name === item.name);
                if (existing) {
                  return prevHistory.map(h =>
                    h.name === item.name
                      ? { ...h, lastPrice: newPrice, lastUpdated: today }
                      : h
                  );
                }
                return [
                  ...prevHistory,
                  {
                    name: item.name,
                    category: item.category,
                    lastPrice: newPrice,
                    lastUpdated: today
                  }
                ];
              });

              return { ...item, currentPrice: newPrice, lastPrice: newPrice };
            }
            return item;
          })
        };
      }
      return list;
    }));
  };

  const calculatePriceDifference = (previous: number, current: number) => {
    return ((current - previous) / previous) * 100;
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setName('');
    setPreviousPrice('');
    setCategory('');
    setTargetPurchase('');
    setError('');
    setIsDropdownOpen(true);
  };

  const filteredDailyLists = dailyLists
    .map(list => ({
      ...list,
      items: list.items
        .filter(item =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'price':
              return a.currentPrice - b.currentPrice;
            case 'difference':
              return (
                calculatePriceDifference(a.previousPrice, a.currentPrice) -
                calculatePriceDifference(b.previousPrice, b.currentPrice)
              );
            default:
              return 0;
          }
        })
    }))
    .filter(list => list.items.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Price Comparison</h1>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <button
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Total Target Purchase"
            >
              ${filteredDailyLists.reduce((total, list) =>
                total + list.items.reduce((sum, item) =>
                  sum + (item.targetPurchase || 0), 0), 0).toFixed(2)}
            </button>
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setIsHistoryOpen(false);
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  aria-label="Add new item"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50">
                  <form onSubmit={handleSubmit} className="p-4 space-y-4 border-t dark:border-gray-700">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Previous Price *
                      </label>
                      <input
                        type="number"
                        id="price"
                        value={previousPrice}
                        onChange={(e) => setPreviousPrice(e.target.value)}
                        className="w-full p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="targetPurchase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Purchase
                      </label>
                      <input
                        type="number"
                        id="targetPurchase"
                        value={targetPurchase}
                        onChange={(e) => setTargetPurchase(e.target.value)}
                        className="w-full p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                  </form>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsHistoryOpen(!isHistoryOpen);
                  }}
                  className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  aria-label="Add from history"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {isHistoryOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 p-4">
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Add from History:
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {itemHistory.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setName(item.name);
                            setPreviousPrice(item.lastPrice.toString());
                            setCategory(item.category);
                            setIsHistoryOpen(false);
                            setIsDropdownOpen(true);
                          }}
                          className="p-2 text-left rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last: ${item.lastPrice.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <SearchAndSort
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        <div className="space-y-6">
          {filteredDailyLists.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
                disabled={currentDayIndex === 0}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {new Date(filteredDailyLists[currentDayIndex].date).toLocaleDateString()}
              </h2>
              <button
                onClick={() => setCurrentDayIndex(prev => Math.min(filteredDailyLists.length - 1, prev + 1))}
                disabled={currentDayIndex === filteredDailyLists.length - 1}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}

          {filteredDailyLists.length > 0 ? (
            <div key={filteredDailyLists[currentDayIndex].date}>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                {filteredDailyLists[currentDayIndex].items.map((item, index) => {
                  const difference = calculatePriceDifference(item.previousPrice, item.currentPrice);
                  const differenceColor = difference < 0 ? 'text-green-500' : difference > 0 ? 'text-red-500' : 'text-gray-500';

                  return (
                    <div
                      key={item.id}
                      className={`col-span-1 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
                        difference > 0
                          ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700'
                          : difference < 0
                          ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700'
                          : 'bg-white dark:bg-gray-800'
                      } ${openItems[item.id] ? 'col-span-3 md:col-span-4' : ''}`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full p-2 text-left"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      </button>
                      
                      {openItems[item.id] && (
                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 w-full overflow-x-auto">
                        <div className="flex-1">
                          <div className="w-full group">
                            <input
                              type="range"
                              min={Math.round(item.previousPrice * 0.5)}
                              max={Math.round(item.previousPrice * 1.5)}
                              value={Math.round(item.currentPrice)}
                              onChange={(e) => handlePriceChange(item.id, Math.round(parseFloat(e.target.value)))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none
                                dark:bg-gray-700
                                group-hover:bg-gray-300 dark:group-hover:bg-gray-600
                                transition-colors duration-300
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-4
                                [&::-webkit-slider-thumb]:h-4
                                [&::-webkit-slider-thumb]:bg-blue-500
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:shadow-md
                                [&::-webkit-slider-thumb]:hover:bg-blue-600
                                [&::-moz-range-thumb]:w-4
                                [&::-moz-range-thumb]:h-4
                                [&::-moz-range-thumb]:bg-blue-500
                                [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:shadow-md
                                [&::-moz-range-thumb]:hover:bg-blue-600"
                              step="1"
                            />
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Previous: ${item.previousPrice.toFixed(2)}</span>
                            <span>Current: ${item.currentPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`${differenceColor} font-medium font-mono min-w-[100px] inline-block text-right`}>
                            {difference.toFixed(1)}%
                          </span>
                          {item.targetPurchase && item.currentPrice && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 inline-block min-w-[100px] text-right">
                              Buy: {Math.round(item.targetPurchase / item.currentPrice)} units
                            </span>
                          )}
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Edit item"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Delete item"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No items found. Add some items to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonApp;
