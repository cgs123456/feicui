<template>
  <div
    class="page-container"
    role="main"
    aria-label="发布商品"
  >
    <AppNavbar
      title="发布商品"
      fallback="/merchant/dashboard"
    />
    <div
      class="publish-steps"
      role="navigation"
      aria-label="发布步骤"
    >
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="step-item"
        :class="{
          active: currentStep === idx,
          completed: currentStep > idx,
          future: currentStep < idx
        }"
        :aria-label="
          '步骤 ' +
            (idx + 1) +
            ': ' +
            step +
            (currentStep === idx ? '，当前步骤' : currentStep > idx ? '，已完成' : '')
        "
        :aria-current="currentStep === idx ? 'step' : undefined"
      >
        <div class="step-circle">
          <van-icon
            v-if="currentStep > idx"
            name="success"
            size="16"
            color="#fff"
          />
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span class="step-label">{{ step }}</span>
        <div
          v-if="idx < steps.length - 1"
          class="step-line"
          :class="{ done: currentStep > idx }"
        />
      </div>
    </div>

    <div class="step-content">
      <div
        v-show="currentStep === 0"
        class="step-body"
      >
        <div
          class="copy-link"
          @click="showCopyPopup = true"
        >
          <van-icon
            name="records"
            size="14"
          />
          <span>复制现有商品</span>
        </div>
        <div class="card">
          <p class="step-hint">
            请上传商品图片（最多9张）
          </p>
          <van-uploader
            v-model="images"
            :max-count="9"
            :preview-size="100"
            multiple
            :after-read="onAfterRead"
            aria-label="上传商品图片"
          />
        </div>
      </div>

      <div
        v-show="currentStep === 1"
        class="step-body"
      >
        <div class="card">
          <van-form ref="formRef">
            <van-field
              v-model="form.title"
              label="商品标题"
              placeholder="请输入商品标题"
              aria-label="商品标题"
              :rules="[{ required: true, message: '请输入商品标题' }]"
            >
              <template #button>
                <span
                  class="ai-optimize-btn"
                  @click="optimizeTitle"
                >AI优化标题</span>
              </template>
            </van-field>
            <van-field
              v-model="form.category"
              is-link
              readonly
              label="品类"
              placeholder="请选择品类"
              aria-label="选择品类"
              @click="showCategoryPicker = true"
            />
            <van-field
              v-model="form.material"
              is-link
              readonly
              label="材质"
              placeholder="请选择材质"
              aria-label="选择材质"
              @click="showMaterialPicker = true"
            />
            <van-field
              v-model="form.price"
              type="number"
              label="价格"
              placeholder="请输入价格"
              aria-label="商品价格"
            />
            <van-field
              v-model="form.size"
              label="尺寸"
              placeholder="请输入尺寸"
              aria-label="商品尺寸"
            />
            <van-field
              v-model="form.description"
              type="textarea"
              label="描述"
              placeholder="请输入商品描述"
              rows="4"
              autosize
              aria-label="商品描述"
            />
          </van-form>
        </div>

        <van-popup
          v-model:show="showCategoryPicker"
          position="bottom"
          round
          aria-label="选择品类"
        >
          <van-picker
            :columns="categoryColumns"
            @confirm="onCategoryConfirm"
            @cancel="showCategoryPicker = false"
          />
        </van-popup>

        <van-popup
          v-model:show="showMaterialPicker"
          position="bottom"
          round
          aria-label="选择材质"
        >
          <van-picker
            :columns="materialColumns"
            @confirm="onMaterialConfirm"
            @cancel="showMaterialPicker = false"
          />
        </van-popup>

        <van-popup
          v-model:show="showCopyPopup"
          position="bottom"
          round
          :style="{ height: '60%' }"
          aria-label="复制现有商品"
        >
          <div class="copy-popup-header">
            选择要复制的商品
          </div>
          <div class="copy-popup-list">
            <div
              v-for="product in copyProductList"
              :key="product.id"
              class="copy-product-item"
              @click="copyProduct(product)"
            >
              <van-image
                :src="product.cover"
                width="50"
                height="50"
                fit="cover"
                radius="4"
              />
              <div class="copy-product-info">
                <span class="copy-product-title">{{ product.title }}</span>
                <span class="copy-product-price">¥{{ (product.price || 0).toLocaleString() }}</span>
              </div>
            </div>
            <div
              v-if="copyProductList.length === 0"
              class="copy-empty"
            >
              暂无商品可复制
            </div>
          </div>
        </van-popup>
      </div>

      <div
        v-show="currentStep === 2"
        class="step-body"
      >
        <div
          v-if="aiLoading"
          class="card ai-loading-card"
          role="status"
          aria-label="AI 正在生成商品信息"
        >
          <van-loading
            size="32"
            color="#07C160"
          />
          <p>AI 正在为您生成商品信息...</p>
        </div>
        <div
          v-else
          class="card"
          role="region"
          aria-label="AI 生成结果"
        >
          <p class="step-hint">
            AI 已为您生成以下信息，可以修改后使用
          </p>
          <van-field
            v-model="aiTitle"
            label="生成标题"
          />
          <van-field
            v-model="aiDescription"
            type="textarea"
            label="生成描述"
            rows="3"
            autosize
          />
          <div class="suggested-tags">
            <span class="tag-label">推荐标签：</span>
            <span
              v-for="tag in aiTags"
              :key="tag"
              class="suggested-tag"
            >{{ tag }}</span>
          </div>
        </div>
      </div>

      <div
        v-show="currentStep === 3"
        class="step-body"
      >
        <div class="card preview-card">
          <h3 class="preview-title">
            发布预览
          </h3>
          <div
            v-if="images.length > 0"
            class="preview-images"
          >
            <van-image
              v-for="(img, idx) in [images[0]]"
              :key="idx"
              :src="(img.url || img.content) as string"
              width="200"
              height="200"
              fit="cover"
              radius="8"
            />
          </div>
          <div class="preview-info">
            <div class="preview-row">
              <span class="preview-label">标题：</span>{{ form.title }}
            </div>
            <div class="preview-row">
              <span class="preview-label">品类：</span>{{ form.category }}
            </div>
            <div class="preview-row">
              <span class="preview-label">材质：</span>{{ form.material }}
            </div>
            <div class="preview-row">
              <span class="preview-label">价格：</span>¥{{ form.price }}
            </div>
            <div class="preview-row">
              <span class="preview-label">尺寸：</span>{{ form.size }}
            </div>
            <div class="preview-row">
              <span class="preview-label">描述：</span>{{ form.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bottom-bar"
      role="toolbar"
      aria-label="发布操作"
    >
      <van-button
        v-if="currentStep > 0"
        round
        aria-label="上一步"
        @click="prevStep"
      >
        上一步
      </van-button>
      <van-button
        v-if="currentStep < 3"
        type="primary"
        round
        :aria-label="currentStep === 2 ? '确认，去发布' : '下一步'"
        @click="nextStep"
      >
        {{ currentStep === 2 ? '确认，去发布' : '下一步' }}
      </van-button>
      <van-button
        v-if="currentStep === 3"
        type="primary"
        round
        aria-label="确认发布"
        @click="publish"
      >
        确认发布
      </van-button>
      <van-button
        v-if="currentStep === 1"
        plain
        round
        aria-label="保存草稿"
        @click="saveDraft"
      >
        保存草稿
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useProductStore } from '../../stores/product'
import type { Product } from '../../types'
import type { UploaderFileListItem } from 'vant'
import AppNavbar from '../../components/AppNavbar.vue'

const router = useRouter()
const productStore = useProductStore()

const steps = ['上传图片', '填写信息', 'AI生成', '发布']
const currentStep = ref(0)
const images = ref<UploaderFileListItem[]>([])
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

const form = reactive({
  title: '',
  category: '',
  material: '',
  price: '',
  size: '',
  description: ''
})

const aiLoading = ref(false)
const aiTitle = ref('')
const aiDescription = ref('')
const aiTags = ref<string[]>([])

// 草稿箱
const DRAFT_KEY = 'jadeite_publish_draft'

function saveDraft() {
  const draft = {
    title: form.title,
    category: form.category,
    material: form.material,
    price: form.price,
    size: form.size,
    description: form.description
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  showToast('草稿已保存')
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return
  try {
    const draft = JSON.parse(raw)
    form.title = draft.title || ''
    form.category = draft.category || ''
    form.material = draft.material || ''
    form.price = draft.price || ''
    form.size = draft.size || ''
    form.description = draft.description || ''
  } catch {
    // ignore
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

onMounted(() => {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (raw) {
    showDialog({
      title: '草稿提示',
      message: '检测到未完成的草稿，是否继续编辑？',
      showCancelButton: true,
      confirmButtonText: '继续编辑',
      cancelButtonText: '放弃'
    }).then(() => {
      loadDraft()
    }).catch(() => {
      clearDraft()
    })
  }
})

// 一键复制
const showCopyPopup = ref(false)
const copyProductList = computed(() => productStore.products.filter((p: Product) => p.status === 'active'))

function copyProduct(product: any) {
  form.title = '【复制】' + (product.title || '')
  form.category = product.category || ''
  form.material = product.material || ''
  form.price = String(product.price || '')
  form.size = product.size || ''
  form.description = product.description || ''
  showCopyPopup.value = false
  showToast('已复制商品信息')
}

// AI标题优化
function optimizeTitle() {
  if (!form.title.trim()) {
    showToast('请先输入标题')
    return
  }
  const parts: string[] = []
  if (form.material) parts.push(form.material)
  if (form.category) parts.push(form.category)
  parts.push('天然缅甸A货')
  // 根据材质推断证书机构
  const certMap: Record<string, string> = {
    玻璃种: 'NGTC国检',
    帝王绿: 'CNAS国际互认',
    冰种: '省级鉴定',
    糯种: '省级鉴定'
  }
  const cert = certMap[form.material] || '权威机构'
  parts.push(cert + '鉴定')
  if (form.size) parts.push(form.size)
  form.title = parts.join(' ')
}

function onAfterRead(file: UploaderFileListItem | UploaderFileListItem[]) {
  const item = Array.isArray(file) ? file[0] : file
  if (item) {
    item.status = 'done'
    item.message = 'success'
  }
}

function onCategoryConfirm({ selectedOptions }: { selectedOptions: Array<{ value: string }> }) {
  form.category = selectedOptions[0].value
  showCategoryPicker.value = false
}

function onMaterialConfirm({ selectedOptions }: { selectedOptions: Array<{ value: string }> }) {
  form.material = selectedOptions[0].value
  showMaterialPicker.value = false
}

function nextStep() {
  if (currentStep.value === 0) {
    if (images.value.length === 0) {
      showToast('请至少上传一张图片')
      return
    }
    currentStep.value++
  } else if (currentStep.value === 1) {
    if (!form.title) {
      showToast('请输入商品标题')
      return
    }
    if (!form.category) {
      showToast('请选择品类')
      return
    }
    currentStep.value++
    aiLoading.value = true
    setTimeout(() => {
      aiLoading.value = false
      aiTitle.value = `高冰种${form.material}翡翠${form.category} 天然缅甸A货`
      aiDescription.value = `精选缅甸天然A货翡翠${form.category}，${form.material}质地通透水润，色泽均匀。${form.description || '纹理细腻，无裂纹无棉絮，佩戴舒适。附权威机构鉴定证书，适合日常佩戴与收藏。'}`
      // 动态标签：材质 + 品类 + 通用属性
      const tags = []
      if (form.material) tags.push(form.material)
      if (form.category) tags.push(`翡翠${form.category}`)
      if (form.price) {
        const p = Number(form.price)
        if (p <= 5000) tags.push('高性价比')
        else if (p >= 50000) tags.push('收藏级')
        else tags.push('送礼佳品')
      }
      tags.push('缅甸A货', '附证书')
      aiTags.value = tags
    }, 2000)
  } else if (currentStep.value === 2) {
    form.title = aiTitle.value
    form.description = aiDescription.value
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function publish() {
  const imageUrls = images.value.filter(f => f.url || f.content).map(f => (f.url || f.content) as string)
  const coverUrl =
    imageUrls[0] ||
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop'

  const materials: Record<string, string> = {
    玻璃种: '约22g',
    冰种: '约18g',
    糯种: '约35g',
    帝王绿: '约12g',
    紫罗兰: '约30g',
    飘花: '约25g',
    黄翡: '约20g',
    红翡: '约20g'
  }
  const styles: Record<string, string> = {
    手镯: '圆条',
    戒指: '镶嵌戒指',
    吊坠: '雕件',
    挂件: '挂件',
    项链: '项链',
    平安扣: '平安扣',
    手链: '手链',
    耳饰: '耳饰'
  }
  const certMap: Record<string, string> = { 玻璃种: 'NGTC国检证书', 帝王绿: 'CNAS国际互认证书', 冰种: '省级鉴定证书' }

  productStore.addProduct({
    id: `P${Date.now()}`,
    title: form.title,
    category: form.category,
    material: form.material,
    price: Number(form.price) || 0,
    originalPrice: Math.round(Number(form.price) * 1.25) || 0,
    cover: coverUrl as string,
    images: imageUrls.length > 0 ? (imageUrls as string[]) : [coverUrl as string],
    size: form.size,
    description: form.description,
    weight: materials[form.material] || '约15g',
    style: styles[form.category] || form.category || '翡翠饰品',
    certificate: certMap[form.material] || '已鉴定',
    status: 'active' as const,
    views: 0,
    inquiries: 0
  })
  showToast('发布成功')
  router.push('/merchant/products')
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.publish-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  background: #fff;
  gap: 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  z-index: 1;
}

.step-item.future .step-circle {
  background: #e5e5e5;
  color: #999;
}

.step-item.active .step-circle {
  background: #07c160;
  color: #fff;
}

.step-item.completed .step-circle {
  background: #07c160;
  color: #fff;
}

.step-label {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.step-item.active .step-label {
  color: #07c160;
  font-weight: 600;
}

.step-item.completed .step-label {
  color: #07c160;
}

.step-line {
  position: absolute;
  top: 14px;
  left: calc(50% + 14px);
  width: calc(100% - 28px);
  height: 2px;
  background: #e5e5e5;
}

.step-line.done {
  background: #07c160;
}

.step-content {
  padding: 12px 16px;
}

.step-body {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-hint {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.ai-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 20px;
  color: #666;
  font-size: 14px;
}

.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
}

.tag-label {
  font-size: 13px;
  color: #999;
}

.suggested-tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #e8f8ee;
  color: #07c160;
}

.preview-card {
  padding: 20px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.preview-images {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-row {
  font-size: 14px;
  color: #333;
  display: flex;
}

.preview-label {
  color: #999;
  flex-shrink: 0;
  width: 56px;
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
  display: flex;
  gap: 12px;
  z-index: 100;
}

.bottom-bar .van-button {
  flex: 1;
  border-radius: 20px;
}

/* 复制链接 */
.copy-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 13px;
  color: #07c160;
  cursor: pointer;
}

.copy-link:active {
  opacity: 0.7;
}

/* AI优化标题按钮 */
.ai-optimize-btn {
  font-size: 12px;
  color: #07c160;
  padding: 2px 8px;
  border: 1px solid #07c160;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
}

.ai-optimize-btn:active {
  background: #e8f8ee;
}

/* 复制商品弹窗 */
.copy-popup-header {
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.copy-popup-list {
  padding: 8px 0;
  max-height: calc(60vh - 52px);
  overflow-y: auto;
}

.copy-product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.copy-product-item:active {
  background: #f5f5f5;
}

.copy-product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.copy-product-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-product-price {
  font-size: 13px;
  color: #e53e3e;
  font-weight: 500;
}

.copy-empty {
  padding: 40px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
