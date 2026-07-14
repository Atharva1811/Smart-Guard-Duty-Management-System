// js/filters.js
// Client-side search and filtering logic helpers

export const filters = {
  // Filter guards list by search query, status, and shift preference
  filterGuards: (guards, query, status, shift) => {
    let filtered = [...guards];

    if (query) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(g => 
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.guard_code && g.guard_code.toLowerCase().includes(q)) ||
        (g.department && g.department.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(g => g.status === status);
    }

    if (shift && shift !== 'All') {
      filtered = filtered.filter(g => g.shift_preference === shift || g.shift_preference === 'Any');
    }

    return filtered;
  },

  // Filter locations list by search query and priority
  filterLocations: (locations, query, priority) => {
    let filtered = [...locations];

    if (query) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(l => 
        (l.location_name && l.location_name.toLowerCase().includes(q)) ||
        (String(l.id).includes(q))
      );
    }

    if (priority && priority !== 'All') {
      const priorityVal = parseInt(priority, 10);
      filtered = filtered.filter(l => l.priority === priorityVal);
    }

    return filtered;
  }
};
