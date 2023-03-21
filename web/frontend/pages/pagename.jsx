import React, {useState, useCallback} from "react";
import { ButtonGroup, Button } from "@shopify/polaris";

import { useForm, useField } from "@shopify/react-form";
import { CurrencyCode } from "@shopify/react-i18n";

import metafields from "../metafields";

import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  MethodCard,
  DiscountStatus,
  RequirementType,
  SummaryCard,
  UsageLimitsCard,
  onBreadcrumbAction,
} from "@shopify/discount-app-components";

import {
  Banner,
  Card,
  Layout,
  Page,
  TextField,
  Stack,
  PageActions,
  ChoiceList,
  Modal,
  List,
  Checkbox,
} from "@shopify/polaris";

import { useAppBridge } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "../hooks";

const ProductList = ["iphone", "laptop", "watch"]

const Collections = ["electronics", "clothes", "videogames", "others"]

const todaysDate = new Date();
const FUNCTION_ID = "01GJ2V7NVEMC02VKBHEVYT364G";





export default function PageName() {
  const app = useAppBridge();
  const [isFirstButtonActive, setIsFirstButtonActive] = useState(true);
  const currencyCode = CurrencyCode.Cad;

  const [selected, setSelected] = useState(["COLLECTIONS"]);
    const [Products, setProducts] = useState([]);
    const [active, setActive] = useState(false);
    const [checked, setChecked] = useState(false);
    const [collections, SetCollection] = useState(Collections);
    const [change, setChange] = useState(true);
    const [OnlyOne, setOnlyOne]=useState(false);
    const [selectedCollection, setSelectedCollection] = useState({
      CollectionsList: [],
      response: [],
    });
  
    const handleChangeModel = useCallback(() => setActive(!active), [active]);
    const activator = <Button onClick={handleChangeModel}>Browser</Button>;

    const handleChange = value => {
      if (value[0] == "COLLECTIONS") {
        setSelected(value);
        setChange(true);
        SetCollection(Collections);
      } else {
        setSelected(value);
        setChange(false);
        setProducts(ProductList);
      }
    };

    const handlerSearch = e => {
      if (e.target.value === "") {
        setProducts(ProductList);
        return;
      } 
      else {
        const FilterProductList = Products.filter(item =>
          item.toLowerCase().includes(e.target.value.toLowerCase())
        );
        setProducts(FilterProductList);
      }
    };

    const handlerSearchSecond = e => {
      if (e.target.value === "") {
        SetCollection(Collections);
        return;
      } else {
        const FilterProductList = Collections.filter(item =>
          item.toLowerCase().includes(e.target.value.toLowerCase())
        );
        SetCollection(FilterProductList);
      }
    };

    const handleChangeCheckbox = e => {
      const { value, checked } = e.target;
      const { CollectionsList } = selectedCollection;
      console.log(`${value} is ${checked}`);
      if (checked) {
        setChecked(checked);
        setSelectedCollection({
          CollectionsList: [...CollectionsList, value],
        });
      } else {
        setChecked(checked);
        setSelectedCollection({
          CollectionsList: CollectionsList.filter(e => e !== value),
        });
      }
    };

    const authenticatedFetch = useAuthenticatedFetch();


    const {
      fields: {
        discountTitle,
        discountCode,
        discountMethod,
        combinesWith,
        requirementType,
        requirementSubtotal,
        requirementQuantity,
        usageTotalLimit,
        usageOncePerCustomer,
        startDate,
        endDate,
        configuration,
        collection,
        products,
      },
            submit,
            submitting,
            dirty,
            reset,
            submitErrors,
            makeClean,

    } = useForm({
      fields: {
        discountTitle: useField(""),
        discountMethod: useField(DiscountMethod.Code),
        discountCode: useField(""),
        combinesWith: useField({
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: false,
        }),
        requirementType: useField(RequirementType.None),
        requirementSubtotal: useField("0"),
        requirementQuantity: useField("0"),
        usageTotalLimit: useField(null),
        usageOncePerCustomer: useField(false),
        startDate: useField(todaysDate),
        endDate: useField(null),
        product:useField(),
        collection:useState(),
        configuration: {
          quantity: useField("1"),
          percentage: useField(""),
          value: useField(""),
        },
      },

      onSubmit: async form => {
        console.log(form, "Form data");
        const discount = {
          functionId: FUNCTION_ID,
          combinesWith: form.combinesWith,
          startsAt: form.startDate,
          endsAt: form.endDate,
          metafields: [
            {
              namespace: metafields.namespace,
              key: metafields.key,
              type: "json",
              value: JSON.stringify({
                quantity: parseInt(form.configuration.quantity),
                percentage: parseFloat(form.configuration.percentage),
              }),
            },
          ],
        };

        let response;
        if (form.discountMethod === DiscountMethod.Automatic) {
          response = await authenticatedFetch("/api/discounts/automatic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              discount: {
                ...discount,
                title: form.discountTitle,
              },
            }),
          });
        } else {
          response = await authenticatedFetch("/api/discounts/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              discount: {
                ...discount,
                title: form.discountCode,
                code: form.discountCode,
              },
            }),
          });
        }

        const {
          errors, // errors like missing scope access
          data,
        } = await response.json();
        const remoteErrors = errors || data?.discountCreate?.userErrors;
  
        if (remoteErrors?.length > 0) {
          return { status: "fail", errors: remoteErrors };
        }
  
        redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
          name: Redirect.ResourceType.Discount,
        });
  
        return { status: "success" };

    }});


    const handleFirstButtonClick = useCallback(() => {
      if (isFirstButtonActive) return;
      setIsFirstButtonActive(true);
    }, [isFirstButtonActive]);


    const handleSecondButtonClick = useCallback(() => {
      if (!isFirstButtonActive) return;
      setIsFirstButtonActive(false);
    }, [isFirstButtonActive]);


    const errorBanner =
    submitErrors.length > 0 ? (
      <Layout.Section>
        <Banner status="critical">
          <p>There were some issues with your form submission:</p>
          <ul>
            {submitErrors.map(({ message }, index) => {
              return <li key={`${message}${index}`}>{message}</li>;
            })}
          </ul>
        </Banner>
      </Layout.Section>
    ) : null;


  return (
    <Page
       title="Create Discount Page"

       primaryAction={{
        content: "Save",
        onAction: submit,
        disabled: !dirty,
        loading: submitting
       }}
    >
      <Layout>
        <Layout.Section>
          <form onSubmit={submit}>
            <MethodCard 
               title="Volume"
               discountTitle={discountTitle}
               discountClass={DiscountClass.Product}
               discountCode={discountCode}
               discountMethod={discountMethod}
              />
            <Card title="Value">
              <Card.Section>
                <Stack>
                  <ButtonGroup segmented>
                    <Button
                    pressed={isFirstButtonActive}
                    onClick={handleFirstButtonClick}
                    >Percentage</Button>
                    <Button
                       pressed={!isFirstButtonActive}
                       onClick={handleSecondButtonClick}
                      >
                      FixedAmount
                    </Button>
                  </ButtonGroup>
                  {isFirstButtonActive ? (
       <TextField
       {...configuration.percentage}
       suffix="%"
       placeholder="0"
     />
   ) :  (
    <TextField
      {...configuration.value}
      prefix="$"
      placeholder="0.00"
    />
  )}
                </Stack>
                <ChoiceList
                  title="APPLY TO"
                  choices={[
                    { label: "Specific collections", value: "COLLECTIONS" },
                    { label: "Specific products", value: "PRODUCTS" },
                  ]}
                  selected={selected}
                  onChange={handleChange}
                />
                <Stack>
                {
                    change?(
                      <TextField  
                  {...configuration.value}
                  />
                    ):(
                      <TextField  
                  {...configuration.value}
                  />
                    )
                  }
                  <div>
                  {change ? (
                    <Modal
                    activator={activator}
                    open={active}
                    onClose={handleChangeModel}
                    title="Add collections"
                    primaryAction={{
                      content: "Add",
                      onAction: handleChangeModel,
                    }}
                    secondaryActions={[
                      {
                        content: "Cancel",
                        onAction: handleChangeModel,
                      },
                    ]}
                  >
                      <input
                          type="text"
                          onChange={handlerSearchSecond}
                          style={{
                            width: "90%",
                            padding: "10px",
                            marginLeft: "30px",
                          }}
                        />
                    <Modal.Section>
                      <Stack>
                        <form>
                          <List>
                          {collections &&
                                  collections.map((item, index) => {
                                    return (
                                      <List.Item key={index}>
                                        <input
                                          type="checkbox"
                                          value={item}
                                          checked={checked}
                                          onChange={handleChangeCheckbox}
                                        />
                                        <label>{item}</label>
                                      </List.Item>
                                    );
                                  })}
                          </List>
                        </form>
                      </Stack>
                    </Modal.Section>
                    </Modal>
                  ) : (
                    <Modal
                    activator={activator}
                    open={active}
                    onClose={handleChangeModel}
                    title="Add Products"
                    primaryAction={{
                      content: "Add",
                      onAction: handleChangeModel,
                    }}
                    secondaryActions={[
                      {
                        content: "Cancel",
                        onAction: handleChangeModel,
                      },
                    ]}
                  >
                            <input
                              type="text"
                              onChange={handlerSearch}
                              style={{
                                width: "90%",
                                padding: "10px",
                                marginLeft: "30px",
                              }}
                            />
                          <Modal.Section>
                              <Stack>
                                <form>
                                  <List>
                                    {Products &&
                                      Products.map((item, index) => {
                                        return (
                                          <List.Item key={index}>
                                            <Checkbox
                                              label={item}
                                              value={item}
                                              name={item}
                                              checked={checked}
                                              // onChange={handleChangeCheckbox}
                                            />
                                          </List.Item>
                                        );
                                      })}
                                  </List>
                                </form>
                              </Stack>
                            </Modal.Section>
                            </Modal>
                  )}    
                  </div>
                </Stack>
              </Card.Section>
            </Card>
            {discountMethod.value === DiscountMethod.Code && (
                <UsageLimitsCard
                totalUsageLimit={usageTotalLimit}
                oncePerCustomer={usageOncePerCustomer}
              />
            )}
              <CombinationCard
              combinableDiscountTypes={combinesWith}
              discountClass={DiscountClass.Product}
              discountDescriptor={
                discountMethod.value === DiscountMethod.Automatic
                  ? discountTitle.value
                  : discountCode.value
              }
            />
             <ActiveDatesCard
              startDate={startDate}
              endDate={endDate}
              timezoneAbbreviation="EST"
            />
          </form>
        </Layout.Section>
        <Layout.Section secondary>

        <SummaryCard
            header={{
              discountMethod: discountMethod.value,
              discountDescriptor:
                discountMethod.value === DiscountMethod.Automatic
                  ? discountTitle.value
                  : discountCode.value,
              appDiscountType: "Volume",
              isEditing: false,
            }}
            performance={{
              status: DiscountStatus.Scheduled,
              usageCount: 0,
            }}
            minimumRequirements={{
              requirementType: requirementType.value,
              subtotal: requirementSubtotal.value,
              quantity: requirementQuantity.value,
              currencyCode: currencyCode,
            }}
            usageLimits={{
              oncePerCustomer: usageOncePerCustomer.value,
              totalUsageLimit: usageTotalLimit.value,
            }}
            activeDates={{
              startDate: startDate.value,
              endDate: endDate.value,
            }}
          />
        </Layout.Section>
        <Layout.Section>
        <PageActions
            primaryAction={{
              content: "Save discount",
              onAction: submit,
              disabled: !dirty,
              loading: submitting,
            }}
            secondaryActions={[
              {
                content: "Discard",
                onAction: () => onBreadcrumbAction(redirect, true),
              },
            ]}
          />

        </Layout.Section>
      </Layout> 
    </Page>
  );
}
