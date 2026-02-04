// API Configuration
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

// State Management
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = 'id';
let sortDirection = 'asc';
let currentCategories = [];

// DOM Elements
const productTableBody = document.getElementById('productTableBody');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const searchInput = document.getElementById('searchInput');
const itemsPerPageSelect = document.getElementById('itemsPerPage');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchCategories();
});

// Fetch all products from API
async function fetchProducts() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        
        updateStats();
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Failed to load products. Please try again later.');
    }
}

// Fetch categories from API
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        currentCategories = await response.json();
        
        // Populate category dropdown in edit modal
        const categorySelect = document.getElementById('editCategory');
        currentCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Show loading state
function showLoading() {
    productTableBody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="loading-container">
                    <div class="spinner-custom"></div>
                </div>
            </td>
        </tr>
    `;
}

// Show error message
function showError(message) {
    productTableBody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="alert alert-danger m-3" role="alert">
                    <i class="fas fa-exclamation-triangle"></i> ${message}
                </div>
            </td>
        </tr>
    `;
}

// Update statistics
function updateStats() {
    document.getElementById('totalProducts').textContent = allProducts.length.toLocaleString();
    
    const avgPrice = allProducts.length > 0 
        ? (allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length).toFixed(2)
        : 0;
    document.getElementById('avgPrice').textContent = `$${avgPrice}`;
    
    const categories = new Set(allProducts.map(p => p.category?.id || 0));
    document.getElementById('totalCategories').textContent = categories.size;
}

// Render product table
function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    if (paginatedProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="text-center py-4">
                        <i class="fas fa-search text-muted" style="font-size: 3rem;"></i>
                        <p class="text-muted mt-3">No products found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    productTableBody.innerHTML = paginatedProducts.map((product, index) => `
        <tr class="fade-in" style="animation-delay: ${index * 0.05}s" 
            onclick="openProductModal(${product.id})">
            <td><strong>#${product.id}</strong></td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-box text-muted me-2"></i>
                    ${truncateText(product.title, 30)}
                </div>
            </td>
            <td>
                <span class="badge bg-success fs-6">
                    <i class="fas fa-dollar-sign"></i> ${product.price.toFixed(2)}
                </span>
            </td>
            <td>
                <span class="category-badge">
                    ${product.category?.name || 'N/A'}
                </span>
            </td>
            <td>
                ${product.images && product.images.length > 0 
                    ? `<img src="${product.images[0]}" alt="${product.title}" class="product-image" 
                           onerror="this.src='https://via.placeholder.com/60?text=No+Image'">`
                    : `<img src="https://via.placeholder.com/60?text=No+Image" alt="No Image" class="product-image">`
                }
            </td>
            <td>
                <div class="description-cell">
                    ${truncateText(product.description || 'No description', 50)}
                    <div class="description-tooltip">
                        <strong>Full Description:</strong><br>
                        ${product.description || 'No description available'}
                    </div>
                </div>
            </td>
        </tr>
    `).join('');

    // Update page info
    const totalFiltered = filteredProducts.length;
    const start = totalFiltered > 0 ? startIndex + 1 : 0;
    const end = Math.min(endIndex, totalFiltered);
    pageInfo.textContent = `Showing ${start} to ${end} of ${totalFiltered} entries`;
}

// Truncate text helper
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    // Create page number links
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
        updatePagination();
    }
}

// Change items per page
function changeItemsPerPage() {
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    currentPage = 1;
    renderTable();
    updatePagination();
}

// Search products
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title && product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Re-apply current sort
    applySort();
    
    currentPage = 1;
    renderTable();
    updatePagination();
}

// Sort functions
function sortById() {
    sortField = 'id';
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    applySort();
    renderTable();
}

function sortByTitle() {
    sortField = 'title';
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    applySort();
    renderTable();
}

function sortByPrice() {
    sortField = 'price';
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    applySort();
    renderTable();
}

function applySort() {
    filteredProducts.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];

        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB ? valueB.toLowerCase() : '';
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

// Export to CSV
function exportToCSV() {
    const dataToExport = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (dataToExport.length === 0) {
        alert('No data to export!');
        return;
    }

    const headers = ['ID', 'Title', 'Price', 'Category', 'Description', 'Image URL'];
    const rows = dataToExport.map(product => [
        product.id,
        `"${product.title.replace(/"/g, '""')}"`,
        product.price,
        product.category?.name || 'N/A',
        `"${(product.description || '').replace(/"/g, '""')}"`,
        product.images?.[0] || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    alert('CSV exported successfully!');
}

// Open product modal for view/edit
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Populate form fields
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editTitle').value = product.title || '';
    document.getElementById('editPrice').value = product.price || 0;
    document.getElementById('editCategory').value = product.category?.id || '';
    document.getElementById('editDescription').value = product.description || '';

    // Display images
    const imagesPreview = document.getElementById('editImagesPreview');
    imagesPreview.innerHTML = product.images && product.images.length > 0
        ? product.images.map(img => 
            `<img src="${img}" alt="Product Image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">`
        ).join('')
        : '<img src="https://via.placeholder.com/80?text=No+Image" alt="No Image">';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Update product via API
async function updateProduct() {
    const productId = document.getElementById('editProductId').value;
    const alertDiv = document.getElementById('modalAlert');

    const updatedProduct = {
        id: parseInt(productId),
        title: document.getElementById('editTitle').value,
        price: parseFloat(document.getElementById('editPrice').value),
        categoryId: parseInt(document.getElementById('editCategory').value),
        description: document.getElementById('editDescription').value
    };

    // Get images from preview or keep existing
    const existingProduct = allProducts.find(p => p.id === parseInt(productId));
    if (existingProduct && existingProduct.images) {
        updatedProduct.images = existingProduct.images;
    }

    try {
        alertDiv.className = 'alert alert-custom d-none';
        alertDiv.textContent = '';

        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) {
            throw new Error('Failed to update product');
        }

        const result = await response.json();

        // Update local data
        const index = allProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            allProducts[index] = result;
        }

        // Refresh display
        await fetchProducts();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();

        alert('Product updated successfully!');
    } catch (error) {
        console.error('Error updating product:', error);
        alertDiv.className = 'alert alert-danger alert-custom';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${error.message}`;
        alertDiv.classList.remove('d-none');
    }
}

// Open create modal
function openCreateModal() {
    // Reset form
    document.getElementById('createForm').reset();
    document.getElementById('createModalAlert').classList.add('d-none');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('createModal'));
    modal.show();
}

// Create new product via API
async function createProduct() {
    const alertDiv = document.getElementById('createModalAlert');

    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const categoryId = parseInt(document.getElementById('createCategory').value);
    const description = document.getElementById('createDescription').value.trim();
    const imagesText = document.getElementById('createImages').value.trim();

    // Validation
    if (!title || !price || !categoryId || !description) {
        alertDiv.className = 'alert alert-danger alert-custom';
        alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please fill in all required fields!';
        alertDiv.classList.remove('d-none');
        return;
    }

    // Parse images
    const images = imagesText ? imagesText.split('\n').map(url => url.trim()).filter(url => url) : [
        'https://via.placeholder.com/300?text=No+Image'
    ];

    const newProduct = {
        title,
        price,
        categoryId,
        description,
        images
    };

    try {
        alertDiv.className = 'alert alert-custom d-none';
        alertDiv.textContent = '';

        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) {
            throw new Error('Failed to create product');
        }

        const result = await response.json();

        // Refresh data
        await fetchProducts();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        modal.hide();

        alert('Product created successfully!');
    } catch (error) {
        console.error('Error creating product:', error);
        alertDiv.className = 'alert alert-danger alert-custom';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${error.message}`;
        alertDiv.classList.remove('d-none');
    }
}

