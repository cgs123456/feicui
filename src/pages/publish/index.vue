<template>
  <div class="page-container" role="main" aria-label="发布商品">
    <AppNavbar title="发布商品" fallback="/merchant/dashboard" />
    <PublishStepNav :current-step="currentStep" />

    <div class="step-content">
      <div v-show="currentStep === 0" class="step-body">
        <UploadStep v-model="images" @copy="showCopyPopup = true" />
      </div>

      <div v-show="currentStep === 1" class="step-body">
        <div class="card">
          <van-form>
            <van-field
              v-model="form.title"
              label="商品标题"
              placeholder="请输入商品标题"
              aria-label="商品标题"
              :rules="[{ required: true, message: '请输入商品标题' }]"
            >
              <template #button>
                <span class="ai-optimize-btn" @click="optimizeTitle">AI优化标题</span>
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

        <van-popup v-model:show="showCategoryPicker" position="bottom" round aria-label="选择品类">
          <van-picker
            :columns="categoryColumns"
            @confirm="onCategoryConfirm"
            @cancel="showCategoryPicker = false"
          />
        </van-popup>

        <van-popup v-model:show="showMaterialPicker" position="bottom" round aria-label="选择材质">
          <van-picker
            :columns="materialColumns"
            @confirm="onMaterialConfirm"
            @cancel="showMaterialPicker = false"
          />
        </van-popup>
      </div>

      <div v-show="currentStep === 2" class="step-body">
        <AiStepPanel
          v-model:title="aiTitle"
          v-model:description="aiDescription"
          :tags="aiTags"
          :loading="aiLoading"
        />
      </div>

      <div v-show="currentStep === 3" class="step-body">
        <PreviewStep :form="form" :images="images" />
      </div>

      <CopyProductPopup v-model:show="showCopyPopup" @select="copyProduct" />
    </div>

    <div class="bottom-bar" role="toolbar" aria-label="发布操作">
      <van-button v-if="currentStep > 0" round aria-label="上一步" @click="prevStep">
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
        :loading="publishing"
        aria-label="确认发布"
        @click="publish"
      >
        确认发布
      </van-button>
      <van-button v-if="currentStep === 1" plain round aria-label="保存草稿" @click="saveDraft">
        保存草稿
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useProductStore } from '../../stores/product'
import { useUserStore } from '../../stores/user'
import { getMerchantInfo, DEFAULT_MERCHANT_ID } from '../../data/merchants'
import type { UploaderFileListItem } from 'vant'
import AppNavbar from '../../components/AppNavbar.vue'
import PublishStepNav from './components/PublishStepNav.vue'
import UploadStep from './components/UploadStep.vue'
import AiStepPanel from './components/AiStepPanel.vue'
import PreviewStep from './components/PreviewStep.vue'
import CopyProductPopup from './components/CopyProductPopup.vue'
import {
  categoryColumns,
  materialColumns,
  titleCertMap,
  materialWeightMap,
  categoryStyleMap,
  publishCertMap
} from './constants'

const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

const currentStep = ref(0)
const images = ref<UploaderFileListItem[]>([])
const showCategoryPicker = ref(false)
const showMaterialPicker = ref(false)

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
    })
      .then(() => {
        loadDraft()
      })
      .catch(() => {
        clearDraft()
      })
  }
})

// 一键复制
const showCopyPopup = ref(false)

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
  const cert = titleCertMap[form.material] || '权威机构'
  parts.push(cert + '鉴定')
  if (form.size) parts.push(form.size)
  form.title = parts.join(' ')
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

const publishing = ref(false)

async function publish() {
  if (publishing.value) return
  if (!form.title.trim()) {
    showToast('请输入商品标题')
    return
  }
  if (!form.category) {
    showToast('请选择品类')
    return
  }
  const price = Number(form.price)
  if (!form.price || Number.isNaN(price) || price <= 0) {
    showToast('请输入有效的商品价格')
    return
  }
  const imageUrls = images.value
    .filter(u => u.url || u.content)
    .map(u => (u.url || u.content) as string)
  const coverUrl =
    imageUrls[0] ||
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=green+jadeite+jewelry+product+photo+studio+lighting+white+background&image_size=square_hd'

  publishing.value = true
  try {
    await productStore.addProduct({
      id: `P${Date.now()}`,
      title: form.title,
      category: form.category,
      material: form.material,
      price: price,
      originalPrice: Math.round(price * 1.25),
      cover: coverUrl as string,
      images: imageUrls.length > 0 ? (imageUrls as string[]) : [coverUrl as string],
      size: form.size,
      description: form.description,
      weight: materialWeightMap[form.material] || '约15g',
      style: categoryStyleMap[form.category] || form.category || '翡翠饰品',
      certificate: publishCertMap[form.material] || '已鉴定',
      status: 'active' as const,
      views: 0,
      inquiries: 0,
      // 多商户归属：发布商品挂到当前登录商家
      merchantId: userStore.userInfo.id || DEFAULT_MERCHANT_ID,
      merchantName: getMerchantInfo(userStore.userInfo.id).name
    })
    showToast('发布成功')
    // 商品已发布，草稿使命完成
    clearDraft()
    router.push('/merchant/products')
  } catch (err) {
    // server 模式发布失败（校验/网络）：提示后留在本页，草稿保留可重试
    showToast(err instanceof Error && err.message ? err.message : '发布失败，请重试')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  padding-bottom: 70px;
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

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
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
</style>
