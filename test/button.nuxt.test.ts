import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import Button from "../app/components/ui/Button.vue"

describe("UiButton", () => {
  it("renders slot content with the accent variant by default", async () => {
    const wrapper = await mountSuspended(Button, { slots: { default: () => "Save" } })
    expect(wrapper.text()).toContain("Save")
    expect(wrapper.classes()).toContain("bg-accent")
  })

  it("switches token classes for the danger variant", async () => {
    const wrapper = await mountSuspended(Button, {
      props: { variant: "danger" },
      slots: { default: () => "Delete" },
    })
    expect(wrapper.classes()).toContain("bg-danger")
    expect(wrapper.classes()).not.toContain("bg-accent")
  })
})
