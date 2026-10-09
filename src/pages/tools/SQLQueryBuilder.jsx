import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Copy, CheckCircle, Plus, Trash2, Filter } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';

const SQLQueryBuilder = () => {
  const [table, setTable] = useState('users');
  const [columns, setColumns] = useState(['id', 'name', 'email']);
  const [newColumn, setNewColumn] = useState('');
  
  const [conditions, setConditions] = useState([]);
  const [limit, setLimit] = useState(100);
  const [orderBy, setOrderBy] = useState('id');
  const [orderDir, setOrderDir] = useState('DESC');
  
  const [query, setQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const showToast = useToast();

  const generateSQL = () => {
    let sql = `SELECT\n  ${columns.length > 0 ? columns.join(',\n  ') : '*'}\nFROM\n  ${table || 'unknown_table'}`;
    
    if (conditions.length > 0) {
      sql += `\nWHERE\n  `;
      sql += conditions.map(c => `${c.field} ${c.operator} ${c.value ? `'${c.value}'` : "''"}`).join(' AND\n  ');
    }

    if (orderBy) {
      sql += `\nORDER BY\n  ${orderBy} ${orderDir}`;
    }

    if (limit) {
      sql += `\nLIMIT ${limit}`;
    }

    setQuery(sql + ';');
  };

  useEffect(() => {
    generateSQL();
  }, [table, columns, conditions, limit, orderBy, orderDir]);

  const addColumn = (e) => {
    e.preventDefault();
    if (!newColumn.trim()) return;
    if (!columns.includes(newColumn.trim())) {
      setColumns([...columns, newColumn.trim()]);
    }
    setNewColumn('');
  };

  const removeColumn = (col) => {
    setColumns(columns.filter(c => c !== col));
  };

  const addCondition = () => {
    setConditions([...conditions, { id: Date.now(), field: columns[0] || 'id', operator: '=', value: '' }]);
  };

  const updateCondition = (id, key, val) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const removeCondition = (id) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    setIsCopied(true);
    showToast('SQL copied!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
      style={{ animationDuration: '8s', maxWidth: '1000px' }}
    >
      <ToolHeader 
        title="Visual SQL Builder" 
        subtitle="Quickly generate standard SELECT queries without making syntax errors." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={18}/> FROM TABLE</h3>
            <input 
              className="input-glass" 
              value={table} 
              onChange={(e) => setTable(e.target.value)} 
              placeholder="Table name..."
            />
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)' }}>SELECT COLUMNS</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {columns.length === 0 && <span style={{ color: 'var(--text-muted)' }}>* (All columns)</span>}
              {columns.map(col => (
                <div key={col} style={{ background: 'var(--accent)', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {col}
                  <button onClick={() => removeColumn(col)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
            <form onSubmit={addColumn} style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input-glass" value={newColumn} onChange={(e) => setNewColumn(e.target.value)} placeholder="Add column..." style={{ flex: 1, padding: '0.5rem' }} />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}><Plus size={16}/></button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Filter size={18}/> WHERE CONDITIONS</h3>
            
            {conditions.map(cond => (
              <div key={cond.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input className="input-glass" value={cond.field} onChange={(e) => updateCondition(cond.id, 'field', e.target.value)} style={{ flex: 1, padding: '0.5rem' }} placeholder="Field" />
                <select className="input-glass" value={cond.operator} onChange={(e) => updateCondition(cond.id, 'operator', e.target.value)} style={{ padding: '0.5rem', minWidth: '80px' }}>
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="LIKE">LIKE</option>
                  <option value="IN">IN</option>
                </select>
                <input className="input-glass" value={cond.value} onChange={(e) => updateCondition(cond.id, 'value', e.target.value)} style={{ flex: 1, padding: '0.5rem' }} placeholder="Value" />
                <button onClick={() => removeCondition(cond.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button>
              </div>
            ))}
            
            <button onClick={addCondition} className="btn-primary" style={{ background: 'var(--surface)', padding: '0.5rem', justifyContent: 'center' }}><Plus size={16}/> Add Condition</button>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '0.9rem' }}>ORDER BY</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-glass" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} placeholder="Field..." style={{ flex: 1, padding: '0.5rem' }} />
                <select className="input-glass" value={orderDir} onChange={(e) => setOrderDir(e.target.value)} style={{ padding: '0.5rem' }}>
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '0.9rem' }}>LIMIT</h3>
              <input type="number" className="input-glass" value={limit} onChange={(e) => setLimit(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
          </div>

        </div>

        {/* Output */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>Generated SQL</span>
            <button 
              onClick={copyQuery} 
              style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />} {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea 
            className="textarea-glass"
            value={query}
            readOnly
            style={{ flex: 1, minHeight: '400px', padding: '1.5rem', border: 'none', borderRadius: 0, fontSize: '1.1rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', background: 'transparent' }}
          />
        </div>

      </div>
    </motion.div>
  );
};

export default SQLQueryBuilder;
