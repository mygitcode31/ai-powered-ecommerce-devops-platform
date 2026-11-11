import { toOptionValues } from "../option-values"

describe("toOptionValues", () => {
  it("converts product options into searchable values", () => {
    const result = toOptionValues([
      {
        title: "Size",
        values: [{ value: "S" }, { value: "M" }],
      },
      {
        title: "Color",
        values: [{ value: "Red" }, { value: "Blue" }],
      },
    ])

    expect(result).toEqual([
      "Size:S",
      "Size:M",
      "Color:Red",
      "Color:Blue",
    ])
  })

  it("removes whitespace and empty values", () => {
    const result = toOptionValues([
      {
        title: " Size ",
        values: [
          { value: " M " },
          { value: " " },
          null,
          { value: null },
        ],
      },
      {
        title: " ",
        values: [{ value: "Red" }],
      },
    ])

    expect(result).toEqual(["Size:M"])
  })

  it("removes duplicate option values", () => {
    const result = toOptionValues([
      {
        title: "Color",
        values: [{ value: "Red" }],
      },
      {
        title: "Color",
        values: [{ value: "Red" }],
      },
    ])

    expect(result).toEqual(["Color:Red"])
  })

  it("returns an empty array when options are missing", () => {
    expect(toOptionValues(undefined)).toEqual([])
    expect(toOptionValues(null)).toEqual([])
  })
})
