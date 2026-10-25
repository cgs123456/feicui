<template>
  <div class="address-edit-page">
    <AppNavbar :title="isEdit ? '编辑地址' : '新增地址'" fallback="/addresses" />

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="收货人"
          placeholder="请输入收货人姓名"
          :rules="[{ required: true, message: '请输入收货人姓名' }]"
        />
        <van-field
          v-model="form.phone"
          type="tel"
          label="手机号"
          maxlength="11"
          placeholder="请输入11位手机号"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1\d{10}$/, message: '手机号格式不正确' }
          ]"
        />
        <van-field
          v-model="regionText"
          is-link
          readonly
          label="所在地区"
          placeholder="请选择省 / 市 / 区"
          :rules="[{ required: true, message: '请选择所在地区' }]"
          @click="showRegion = true"
        />
        <van-field
          v-model="form.detail"
          label="详细地址"
          type="textarea"
          rows="2"
          autosize
          placeholder="街道、门牌号、小区等"
          :rules="[{ required: true, message: '请输入详细地址' }]"
        />
      </van-cell-group>

      <van-cell-group inset>
        <van-cell title="设为默认地址" center>
          <template #right-icon>
            <van-switch v-model="form.isDefault" size="22" />
          </template>
        </van-cell>
      </van-cell-group>

      <div class="submit-wrap">
        <van-button type="primary" block round native-type="submit" :loading="saving">
          保存
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showRegion" position="bottom" round>
      <van-area
        :area-list="areaList"
        :columns-num="3"
        title="选择地区"
        @confirm="onRegionConfirm"
        @cancel="showRegion = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { areaList } from '@vant/area-data'
import { useAddressStore } from '../../stores/address'
import AppNavbar from '../../components/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const addressStore = useAddressStore()

const editId = computed(() => (route.params.id as string) || '')
const isEdit = computed(() => editId.value !== '')
const editing = isEdit.value ? addressStore.addresses.find(a => a.id === editId.value) : null

const form = reactive({
  name: editing?.name || '',
  phone: editing?.phone || '',
  province: editing?.province || '',
  city: editing?.city || '',
  district: editing?.district || '',
  detail: editing?.detail || '',
  isDefault: editing?.isDefault ?? false
})

const showRegion = ref(false)
const regionText = computed(() =>
  [form.province, form.city, form.district].filter(Boolean).join(' / ')
)

function onRegionConfirm({ selectedOptions }: { selectedOptions: Array<{ text: string }> }) {
  const [province, city, district] = selectedOptions
  form.province = province?.text || ''
  form.city = city?.text || ''
  form.district = district?.text || ''
  showRegion.value = false
}

const saving = ref(false)

async function onSubmit() {
  if (saving.value) return
  saving.value = true
  try {
    if (isEdit.value) {
      await addressStore.updateAddress(editId.value, { ...form })
      showToast('地址已更新')
    } else {
      await addressStore.addAddress({ ...form })
      showToast('地址已保存')
    }
    router.push('/addresses')
  } catch (err) {
    showToast(err instanceof Error && err.message ? err.message : '保存失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.address-edit-page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 40px;
}

.submit-wrap {
  padding: 24px 16px 0;
}
</style>
