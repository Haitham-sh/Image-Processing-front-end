document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const elements = {
        gallery: document.getElementById('imageGallery'),
        originalImage: document.getElementById('originalImage'),
        processedImage: document.getElementById('processedImage'),
        noImageSelected: document.getElementById('noImageSelected'),
        noProcessedImage: document.getElementById('noProcessedImage'),
        widthInput: document.getElementById('width'),
        heightInput: document.getElementById('height'),
        resizeBtn: document.getElementById('resizeBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        loadingSpinner: document.getElementById('loadingSpinner')
    };

    // روابط API
    const API = {
        github: 'https://api.github.com/repos/Haitham-sh/Image-Processing-API/contents/src/images',
        processing: 'https://image-processing-api.up.railway.app/api/image'
    };

    // حالة التطبيق
    let state = {
        selectedImage: null,
        processedImageUrl: null
    };

    // تحميل الصور من GitHub
    async function loadImages() {
        try {
            showLoading(true);
            const response = await fetch(API.github);
            const data = await response.json();
            
            // تصفية الملفات لاستبعاد المجلدات
            const imageFiles = data.filter(file => 
                file.type === 'file' && /\.(jpg|jpeg|png|gif)$/i.test(file.name)
            );
            
            displayImages(imageFiles);
        } catch (error) {
            console.error('Error loading images:', error);
            elements.gallery.innerHTML = '<p class="error">حدث خطأ أثناء تحميل الصور</p>';
        } finally {
            showLoading(false);
        }
    }

    // عرض الصور في المعرض
    function displayImages(images) {
        elements.gallery.innerHTML = '';
        
        if (images.length === 0) {
            elements.gallery.innerHTML = '<p class="no-images">لا توجد صور متاحة</p>';
            return;
        }
        
        images.forEach(image => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            
            const img = document.createElement('img');
            img.src = image.download_url;
            img.alt = image.name;
            img.loading = 'lazy';
            
            thumbnail.appendChild(img);
            elements.gallery.appendChild(thumbnail);
            
            thumbnail.addEventListener('click', () => selectImage(image));
        });
    }

    // اختيار صورة من المعرض
    function selectImage(image) {
        state.selectedImage = image;
        elements.originalImage.src = image.download_url;
        elements.originalImage.style.display = 'block';
        elements.noImageSelected.style.display = 'none';
        
        resetProcessedImage();
        elements.resizeBtn.disabled = false;
    }

    // إعادة تعيين الصورة المعدلة
    function resetProcessedImage() {
        state.processedImageUrl = null;
        elements.processedImage.style.display = 'none';
        elements.noProcessedImage.style.display = 'block';
        elements.downloadBtn.style.display = 'none';
        elements.downloadBtn.disabled = true;
    }

    // تغيير حجم الصورة باستخدام API
    async function resizeImage() {
        if (!state.selectedImage) return;
        
        const width = elements.widthInput.value;
        const height = elements.heightInput.value;
        
        if (!width && !height) {
            showError('الرجاء إدخال عرض أو ارتفاع');
            return;
        }
        
        try {
            showLoading(true);
            hideError();
            
            // إنشاء رابط API لتغيير حجم الصورة
            const imageName = state.selectedImage.name.replace(/\.[^/.]+$/, ""); // إزالة الامتداد
            const apiUrl = `${API.processing}?filename=${imageName}&width=${width}&height=${height}`;
            
            // جلب الصورة المعدلة
            elements.processedImage.src = apiUrl;
            state.processedImageUrl = apiUrl;
            
            // الانتظار حتى يتم تحميل الصورة
            await new Promise((resolve, reject) => {
                elements.processedImage.onload = resolve;
                elements.processedImage.onerror = reject;
            });
            
            // عرض النتيجة
            elements.processedImage.style.display = 'block';
            elements.noProcessedImage.style.display = 'none';
            elements.downloadBtn.style.display = 'block';
            elements.downloadBtn.disabled = false;
            
        } catch (error) {
            console.error('Error:', error);
            showError('حدث خطأ أثناء معالجة الصورة. تأكد من إدخال أبعاد صحيحة.');
            resetProcessedImage();
        } finally {
            showLoading(false);
        }
    }

    // حفظ الصورة المعدلة
    function downloadImage() {
        if (!state.processedImageUrl) return;
        
        const link = document.createElement('a');
        link.href = state.processedImageUrl;
        link.download = `processed_${state.selectedImage.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // عرض/إخفاء مؤشر التحميل
    function showLoading(show) {
        elements.loadingSpinner.style.display = show ? 'block' : 'none';
        elements.resizeBtn.disabled = show;
        elements.resizeBtn.textContent = show ? 'جاري المعالجة...' : 'تغيير الحجم';
    }

    // عرض رسالة خطأ
    function showError(message) {
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            document.querySelector('.controls').appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    // إخفاء رسالة الخطأ
    function hideError() {
        const errorElement = document.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // أحداث
    elements.resizeBtn.addEventListener('click', resizeImage);
    elements.downloadBtn.addEventListener('click', downloadImage);

    // تهيئة الصفحة
    loadImages();
});