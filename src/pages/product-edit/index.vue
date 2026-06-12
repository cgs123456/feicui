<template>
  <div class="page-container">
    <AppNavbar title="编辑商品" @click-left="goBack" />
    <div class="edit-content" v-if="product">
      <div class="card">
        <div class="image-section">
          <p class="section-label">商品图片</p>
          <div class="image-grid">
            <van-image
              v-for="(img, idx) in product.images || [product.cover]"
              :key="idx"
              lazy-load
              :src="img"
              width="100"
              height="100"
              fit="cover"
              radius="8"
            />
            <van-uploader :max-count="1" :preview-size="100" :after-read="onUploadImage" />
          </div>
        </div>

        <van-form ref="formRef">
          <van-field v-model="editForm.title" label="商品标题" placeholder="请输入商品标题" />
          <van-field
            v-model="editForm.category"
            is-link
            readonly
            label="品类"
            placeholder="请选择品类"
            @click="showCategoryPicker = true"
          />
          <van-field
            v-model="editForm.material"
            is-link
            readonly
            label="材质"
            placeholder="请选择材质"
            @click="showMaterialPicker = true"
          />
          <van-field v-model="editForm.price" type="number" label="价格" placeholder="请输入价格" />
          <van-field
            v-model="editForm.originalPrice"
            type="number"
            label="原价"
            placeholder="请输入原价"
          />
          <van-field v-model="editForm.size" label="尺寸" placeholder="请输入尺寸" />
          <van-field v-model="editForm.weight" label="重量" placeholder="请输入重量" />
          <van-field v-model="editForm.style" label="款式" placeholder="请输入款式" />
          <van-field v-model="editForm.certificate" label="证书" placeholder="请输入证书类型" />
          <van-field
            v-model="editForm.description"
            type="textarea"
            label="描述"
            placeholder="请输入商品描述"
            rows="4"
            autosize
          />
        </van-form>

        <van-popup v-model:show="showCategoryPicker" position="bottom" round>
          <van-picker
            :columns="categoryColumns"
            @confirm="onCategoryConfirm"
            @cancel="showCategoryPicker = false"
          />
        </van-popup>

        <van-popup v-model:show="showMaterialPicker" position="bottom" round>
          <van-picker
            :columns="materialColumns"
            @confirm="onMaterialConfirm"
            @cancel="showMaterialPicker = false"
          />
        </van-popup>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button type="primary" block round @click="saveEdit">保存修改</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useProductStore } from '../../stores/product'
import AppNavbar from '../../components/AppNavbar.vue'

const router = useRouter()
const route = useRoute()
const productStore = useProductStore()

const product = computed(() => productStore.getProductById(route.params.id))

const editForm = reactive({
  title: '',
  category: '',
  material: '',
  price: '',
  originalPrice: '',
  size: '',
  weight: '',
  style: '',
  certificate: '',
  description: ''
})

// 路由参数变化时重置表单
watch(
  () => route.params.id,
  newId => {
    const p = productStore.getProductById(newId)
    editForm.title = p?.title || ''
    editForm.category = p?.category || ''
    editForm.material = p?.material || ''
    editForm.price = String(p?.price || '')
    editForm.originalPrice = String(p?.originalPrice || '')
    editForm.size = p?.size || ''
    editForm.weight = p?.weight || ''
    editForm.style = p?.style || ''
    editForm.certificate = p?.certificate || ''
    editForm.description = p?.description || ''
  },
  { immediate: true }
)

const showCategoryPicker = ref(false)
const showMaterialPicker = ref(false)

const categoryColumns = [
  { text: '手镯', value: '手镯' },
  { text: '戒指', value: '戒指' },
  { text: '吊坠', value: '吊坠' },
  { text: '挂件', value: '挂件' },
  { text: '项链', value: '项链' },
  { text: '平安扣', value: '平安扣' },
  { text: '手链', value: '手链' },
  { text: '耳饰', value: '耳饰' }
]

const materialColumns = [
  { text: '玻璃种', value: '玻璃种' },
  { text: '冰种', value: '冰种' },
  { text: '糯种', value: '糯种' },
  { text: '帝王绿', value: '帝王绿' },
  { text: '紫罗兰', value: '紫罗兰' },
  { text: '飘花', value: '飘花' },
  { text: '黄翡', value: '黄翡' },
  { text: '红翡', value: '红翡' }
]

function onUploadImage(file) {
  showToast('图片上传成功')
}

function onCategoryConfirm({ selectedOptions }) {
  editForm.category = selectedOptions[0].value
  showCategoryPicker.value = false
}

function onMaterialConfirm({ selectedOptions }) {
  editForm.material = selectedOptions[0].value
  showMaterialPicker.value = false
}

function saveEdit() {
  productStore.updateProduct(product.value.id, {
    ...editForm,
    price: Number(editForm.price) || 0,
    originalPrice: Number(editForm.originalPrice) || 0
  })
  showToast('保存成功')
  router.back()
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.edit-content {
  padding: 12px 16px;
}

.image-section {
  margin-bottom: 8px;
}

.section-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 10px;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 100;
}

.bottom-bar .van-button {
  border-radius: 20px;
  height: 44px;
}
</style>
