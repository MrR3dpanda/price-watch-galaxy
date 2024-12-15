import { useState, useEffect, useRef } from 'react';

interface PriceItem {
  id: string;
  name: string;
  previousPrice: number;
  currentPrice: number;
  category: string;
  createdAt: Date;
}

const PriceComparisonApp = () => {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [name, setName] = useState('');
  const [previousPrice, setPreviousPrice] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'difference'>('name');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedItems = localStorage.getItem('priceItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
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
    localStorage.setItem('priceItems', JSON.stringify(items));
  }, [items]);

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

    if (!editingItem && items.some(item => item.name.toLowerCase() === name.toLowerCase())) {
      setError('An item with this name already exists');
      return;
    }

    if (editingItem) {
      setItems(prev =>
        prev.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                name,
                previousPrice: priceValue,
                currentPrice: priceValue,
                category,
              }
            : item
        )
      );
    } else {
      const newItem: PriceItem = {
        id: Date.now().toString(),
        name,
        previousPrice: priceValue,
        currentPrice: priceValue,
        category,
        createdAt: new Date(),
      };
      setItems(prev => [...prev, newItem]);
    }

    setName('');
    setPreviousPrice('');
    setCategory('');
    setError('');
    setIsDropdownOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (item: PriceItem) => {
    setEditingItem(item);
    setName(item.name);
    setPreviousPrice(item.previousPrice.toString());
    setCategory(item.category);
    setIsDropdownOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, currentPrice: newPrice } : item
      )
    );
  };

  const calculatePriceDifference = (previous: number, current: number) => {
    return ((current - previous) / previous) * 100;
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setName('');
    setPreviousPrice('');
    setCategory('');
    setError('');
    setIsDropdownOpen(true);
  };

  const filteredItems = items
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
    });

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Price Comparison</h1>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleAddNew}
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
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Price *
                    </label>
                    <input
                      type="number"
                      id="price"
                      value={previousPrice}
                      onChange={(e) => setPreviousPrice(e.target.value)}
                      className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
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
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'difference')}
            className="p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="difference">Sort by Difference</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredItems.map(item => {
            const difference = calculatePriceDifference(item.previousPrice, item.currentPrice);
            const differenceColor = difference < 0 ? 'text-green-500' : difference > 0 ? 'text-red-500' : 'text-gray-500';

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={item.previousPrice * 0.5}
                      max={item.previousPrice * 1.5}
                      value={item.currentPrice}
                      onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                      className="w-full"
                      step="0.01"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Previous: ${item.previousPrice.toFixed(2)}</span>
                      <span>Current: ${item.currentPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`${differenceColor} font-medium`}>
                      {difference.toFixed(1)}%
                    </span>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label="Edit item"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No items found. Add some items to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonApp;