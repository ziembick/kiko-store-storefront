import { test, expect } from "../../index"

test.describe("Testes de perfil da conta", () => {
  test("Fluxo de atualização completa do perfil", async ({
    accountOverviewPage: overviewPage,
    accountProfilePage: profilePage,
  }) => {
    await overviewPage.goto()
    await expect(overviewPage.profileCompletion).toHaveText("50%")

    await test.step("navegar para a página de perfil", async () => {
      await profilePage.profileLink.click()
      await expect(profilePage.profileWrapper).toBeVisible()
    })

    await test.step("atualizar o número de telefone salvo no perfil", async () => {
      await expect(profilePage.savedPhone).toHaveText("null")
      await profilePage.phoneEditButton.click()
      await profilePage.phoneInput.fill("8888888888")
      await profilePage.phoneSaveButton.click()
      await expect(profilePage.phoneSuccessMessage).toBeVisible()
      await expect(profilePage.savedPhone).toHaveText("8888888888")
    })

    await test.step("verificar o estado de conclusão do perfil e voltar para a página de perfil", async () => {
      await profilePage.overviewLink.click()
      await expect(overviewPage.profileCompletion).toHaveText("75%")

      await profilePage.profileLink.click()
      await expect(profilePage.profileWrapper).toBeVisible()
    })

    await test.step("adicionar o endereço de cobrança", async () => {
      await expect(profilePage.savedBillingAddress).toContainText(
        "Sem endereço de cobrança"
      )
      await profilePage.billingAddressEditButton.click()
      await profilePage.billingFirstNameInput.fill("Primeiro")
      await profilePage.billingLastNameInput.fill("Último")
      await profilePage.billingAddress1Input.fill("123 Rua Falsa")
      await profilePage.billingPostcalCodeInput.fill("11111")
      await profilePage.billingCityInput.fill("Springdale")
      await profilePage.billingProvinceInput.fill("IL")
      await profilePage.billingCountryCodeSelect.selectOption({
        label: "Estados Unidos",
      })
      await profilePage.billingAddressSaveButton.click()
      await expect(profilePage.billingAddressSuccessMessage).toBeVisible()
    })

    await test.step("estado de conclusão do perfil", async () => {
      await profilePage.overviewLink.click()
      await expect(overviewPage.profileCompletion).toHaveText("100%")

      await profilePage.goto()
      await expect(profilePage.savedBillingAddress).toContainText("Primeiro Último")
      await expect(profilePage.savedBillingAddress).toContainText(
        "123 Rua Falsa"
      )
      await expect(profilePage.savedBillingAddress).toContainText(
        "11111, Springdale"
      )
      await expect(profilePage.savedBillingAddress).toContainText(
        "Estados Unidos"
      )
    })
  })

  test("Alterações no perfil persistem após atualizar a página e fazer logout", async ({
    page,
    loginPage,
    accountOverviewPage: overviewPage,
    accountProfilePage: profilePage,
  }) => {
    await overviewPage.goto()
    await expect(overviewPage.profileCompletion).toHaveText("50%")

    await test.step("navegar para a página de perfil", async () => {
      await profilePage.profileLink.click()
      await expect(profilePage.profileWrapper).toBeVisible()
    })

    await test.step("atualizar o primeiro nome e sobrenome", async () => {
      await profilePage.nameEditButton.click()
      await profilePage.firstNameInput.fill("PrimeiroNovo")
      await profilePage.lastNameInput.fill("ÚltimoNovo")
      await profilePage.nameSaveButton.click()
      await profilePage.nameSuccessMessage.waitFor({ state: "visible" })
    })

    await test.step("atualizar o número de telefone salvo no perfil", async () => {
      await expect(profilePage.savedPhone).toHaveText("null")
      await profilePage.phoneEditButton.click()
      await profilePage.phoneInput.fill("8888888888")
      await profilePage.phoneSaveButton.click()
      await expect(profilePage.phoneSuccessMessage).toBeVisible()
      await expect(profilePage.savedPhone).toHaveText("8888888888")
    })

    await test.step("adicionar o endereço de cobrança", async () => {
      await expect(profilePage.savedBillingAddress).toContainText(
        "Sem endereço de cobrança"
      )
      await profilePage.billingAddressEditButton.click()
      await profilePage.billingFirstNameInput.fill("Primeiro")
      await profilePage.billingLastNameInput.fill("Último")
      await profilePage.billingAddress1Input.fill("123 Rua Falsa")
      await profilePage.billingPostcalCodeInput.fill("11111")
      await profilePage.billingCityInput.fill("Springdale")
      await profilePage.billingProvinceInput.fill("IL")
      await profilePage.billingCountryCodeSelect.selectOption({
        label: "Estados Unidos",
      })
      await profilePage.billingAddressSaveButton.click()
      await expect(profilePage.billingAddressSuccessMessage).toBeVisible()
    })

    await test.step("Atualizar a página e verificar se as informações salvas ainda estão lá", async () => {
      await page.reload()
      await expect(profilePage.savedName).toContainText("PrimeiroNovo")
      await expect(profilePage.savedName).toContainText("ÚltimoNovo")
      await expect(profilePage.savedPhone).toContainText("8888888888")

      await expect(profilePage.savedBillingAddress).toContainText("Primeiro Último")
      await expect(profilePage.savedBillingAddress).toContainText(
        "123 Rua Falsa"
      )
      await expect(profilePage.savedBillingAddress).toContainText(
        "11111, Springdale"
      )
      await expect(profilePage.savedBillingAddress).toContainText(
        "Estados Unidos"
      )
    })

    await test.step("Fazer logout e login novamente", async () => {
      await profilePage.logoutLink.click()
      await expect(loginPage.container).toBeVisible()
      await loginPage.emailInput.fill("teste@exemplo.com")
      await loginPage.passwordInput.fill("senha")
      await loginPage.signInButton.click()
      await overviewPage.overviewWrapper.waitFor({ state: "visible" })
      await overviewPage.profileLink.click()
      await profilePage.profileWrapper.waitFor({ state: "visible" })
    })

    await test.step("Verificar se as informações salvas no perfil estão corretas", async () => {
      await expect(profilePage.savedName).toContainText("PrimeiroNovo")
      await expect(profilePage.savedName).toContainText("ÚltimoNovo")
      await expect(profilePage.savedPhone).toContainText("8888888888")

      await expect(profilePage.savedBillingAddress).toContainText("Primeiro Último")
      await expect(profilePage.savedBillingAddress).toContainText(
        "123 Rua Falsa"
      )
      await expect(profilePage.savedBillingAddress).toContainText(
        "11111, Springdale"
      )
      await expect(profilePage.savedBillingAddress).toContainText(
        "Estados Unidos"
      )
    })
  })

  test("Verifica se as alterações de senha funcionam corretamente", async ({
    loginPage,
    accountProfilePage: profilePage,
    accountOverviewPage: overviewPage,
  }) => {
    await test.step("Navegar para a página de perfil da conta", async () => {
      await overviewPage.goto()
      await profilePage.profileLink.click()
    })

    await test.step("Atualizar a senha", async () => {
      await profilePage.passwordEditButton.click()
      await profilePage.oldPasswordInput.fill("senha")
      await profilePage.newPasswordInput.fill("nova-senha")
      await profilePage.confirmPasswordInput.fill("nova-senha")
      await profilePage.passwordSaveButton.click()
      await expect(profilePage.passwordSuccessMessage).toBeVisible()
    })

    await test.step("Fazer logout e login novamente", async () => {
      await profilePage.logoutLink.click()
      await expect(loginPage.container).toBeVisible()
      await loginPage.emailInput.fill("teste@exemplo.com")
      await loginPage.passwordInput.fill("nova-senha")
      await loginPage.signInButton.click()
      await expect(overviewPage.container).toBeVisible()
    })
  })

  test("Verificar se alterar o endereço de email atualiza o usuário corretamente", async ({
    loginPage,
    accountProfilePage: profilePage,
    accountOverviewPage: accountPage,
  }) => {
    await test.step("Atualizar o email do usuário", async () => {
      await accountPage.goto()
      await accountPage.welcomeMessage.waitFor({ state: "visible" })
      await accountPage.profileLink.click()
      await profilePage.profileWrapper.waitFor({ state: "visible" })
      await profilePage.emailEditButton.click()
      await profilePage.emailInput.fill("teste-111@exemplo.com")
      await profilePage.emailSaveButton.click()
      await profilePage.emailSuccessMessage.waitFor({ state: "visible" })
    })

    await test.step("Tentar fazer login novamente com o email antigo", async () => {
      await profilePage.logoutLink.click()
      await loginPage.container.waitFor({ state: "visible" })
      await loginPage.emailInput.fill("teste@exemplo.com")
      await loginPage.passwordInput.fill("senha")
      await loginPage.signInButton.click()
      await loginPage.errorMessage.waitFor({ state: "visible" })
    })

    await test.step("Fazer login com o novo email", async () => {
      await loginPage.emailInput.fill("teste-111@exemplo.com")
      await loginPage.signInButton.click()
      await accountPage.welcomeMessage.waitFor({ state: "visible" })
    })

    await test.step("Reverter o email para teste@exemplo.com", async () => {
      await accountPage.profileLink.click()
      await profilePage.profileWrapper.waitFor({ state: "visible" })
      await profilePage.emailEditButton.click()
      await profilePage.emailInput.fill("teste@exemplo.com")
      await profilePage.emailSaveButton.click()
      await profilePage.emailSuccessMessage.waitFor({ state: "visible" })
    })

    await test.step("Fazer logout e login com o email original", async () => {
      await profilePage.logoutLink.click()
      await loginPage.container.waitFor({ state: "visible" })
      await loginPage.emailInput.fill("teste@exemplo.com")
      await loginPage.passwordInput.fill("senha")
      await loginPage.signInButton.click()
      await accountPage.welcomeMessage.waitFor({ state: "visible" })
    })
  })
})

// import { test, expect } from "../../index"

// test.describe("Account profile tests", () => {
//   test("Profile completed update flow", async ({
//     accountOverviewPage: overviewPage,
//     accountProfilePage: profilePage,
//   }) => {
//     await overviewPage.goto()
//     await expect(overviewPage.profileCompletion).toHaveText("50%")

//     await test.step("navigate to the profile page", async () => {
//       await profilePage.profileLink.click()
//       await expect(profilePage.profileWrapper).toBeVisible()
//     })

//     await test.step("update the saved profile phone number", async () => {
//       await expect(profilePage.savedPhone).toHaveText("null")
//       await profilePage.phoneEditButton.click()
//       await profilePage.phoneInput.fill("8888888888")
//       await profilePage.phoneSaveButton.click()
//       await expect(profilePage.phoneSuccessMessage).toBeVisible()
//       await expect(profilePage.savedPhone).toHaveText("8888888888")
//     })

//     await test.step("verify the profile completion state and go back to the profile page", async () => {
//       await profilePage.overviewLink.click()
//       await expect(overviewPage.profileCompletion).toHaveText("75%")

//       await profilePage.profileLink.click()
//       await expect(profilePage.profileWrapper).toBeVisible()
//     })

//     await test.step("enter in the billing address", async () => {
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "No billing address"
//       )
//       await profilePage.billingAddressEditButton.click()
//       await profilePage.billingFirstNameInput.fill("First")
//       await profilePage.billingLastNameInput.fill("Last")
//       await profilePage.billingAddress1Input.fill("123 Fake Street")
//       await profilePage.billingPostcalCodeInput.fill("11111")
//       await profilePage.billingCityInput.fill("Springdale")
//       await profilePage.billingProvinceInput.fill("IL")
//       await profilePage.billingCountryCodeSelect.selectOption({
//         label: "United States",
//       })
//       await profilePage.billingAddressSaveButton.click()
//       await expect(profilePage.billingAddressSuccessMessage).toBeVisible()
//     })

//     await test.step("profile completion state", async () => {
//       await profilePage.overviewLink.click()
//       await expect(overviewPage.profileCompletion).toHaveText("100%")

//       await profilePage.goto()
//       await expect(profilePage.savedBillingAddress).toContainText("First Last")
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "123 Fake Street"
//       )
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "11111, Springdale"
//       )
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "United States"
//       )
//     })
//   })

//   test("Profile changes persist across page refreshes and logouts", async ({
//     page,
//     loginPage,
//     accountOverviewPage: overviewPage,
//     accountProfilePage: profilePage,
//   }) => {
//     await overviewPage.goto()
//     await expect(overviewPage.profileCompletion).toHaveText("50%")

//     await test.step("navigate to the profile page", async () => {
//       await profilePage.profileLink.click()
//       await expect(profilePage.profileWrapper).toBeVisible()
//     })

//     await test.step("update the first and last name", async () => {
//       await profilePage.nameEditButton.click()
//       await profilePage.firstNameInput.fill("FirstNew")
//       await profilePage.lastNameInput.fill("LastNew")
//       await profilePage.nameSaveButton.click()
//       await profilePage.nameSuccessMessage.waitFor({ state: "visible" })
//     })

//     await test.step("update the saved profile phone number", async () => {
//       await expect(profilePage.savedPhone).toHaveText("null")
//       await profilePage.phoneEditButton.click()
//       await profilePage.phoneInput.fill("8888888888")
//       await profilePage.phoneSaveButton.click()
//       await expect(profilePage.phoneSuccessMessage).toBeVisible()
//       await expect(profilePage.savedPhone).toHaveText("8888888888")
//     })

//     await test.step("enter in the billing address", async () => {
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "No billing address"
//       )
//       await profilePage.billingAddressEditButton.click()
//       await profilePage.billingFirstNameInput.fill("First")
//       await profilePage.billingLastNameInput.fill("Last")
//       await profilePage.billingAddress1Input.fill("123 Fake Street")
//       await profilePage.billingPostcalCodeInput.fill("11111")
//       await profilePage.billingCityInput.fill("Springdale")
//       await profilePage.billingProvinceInput.fill("IL")
//       await profilePage.billingCountryCodeSelect.selectOption({
//         label: "United States",
//       })
//       await profilePage.billingAddressSaveButton.click()
//       await expect(profilePage.billingAddressSuccessMessage).toBeVisible()
//     })

//     await test.step("Refresh page and verify information saved is still there", async () => {
//       await page.reload()
//       await expect(profilePage.savedName).toContainText("FirstNew")
//       await expect(profilePage.savedName).toContainText("LastNew")
//       await expect(profilePage.savedPhone).toContainText("8888888888")

//       await expect(profilePage.savedBillingAddress).toContainText("First Last")
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "123 Fake Street"
//       )
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "11111, Springdale"
//       )
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "United States"
//       )
//     })

//     await test.step("Log out and log back in", async () => {
//       await profilePage.logoutLink.click()
//       await expect(loginPage.container).toBeVisible()
//       await loginPage.emailInput.fill("test@example.com")
//       await loginPage.passwordInput.fill("password")
//       await loginPage.signInButton.click()
//       await overviewPage.overviewWrapper.waitFor({ state: "visible" })
//       await overviewPage.profileLink.click()
//       await profilePage.profileWrapper.waitFor({ state: "visible" })
//     })

//     await test.step("Verify the saved profile information is correct", async () => {
//       await expect(profilePage.savedName).toContainText("FirstNew")
//       await expect(profilePage.savedName).toContainText("LastNew")
//       await expect(profilePage.savedPhone).toContainText("8888888888")

//       await expect(profilePage.savedBillingAddress).toContainText("First Last")
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "123 Fake Street"
//       )
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "11111, Springdale"
//       )
//       await expect(profilePage.savedBillingAddress).toContainText(
//         "United States"
//       )
//     })
//   })

//   test("Verifies password changes work correctly", async ({
//     loginPage,
//     accountProfilePage: profilePage,
//     accountOverviewPage: overviewPage,
//   }) => {
//     await test.step("Navigate to the account Profile page", async () => {
//       await overviewPage.goto()
//       await profilePage.profileLink.click()
//     })

//     await test.step("Update the password", async () => {
//       await profilePage.passwordEditButton.click()
//       await profilePage.oldPasswordInput.fill("password")
//       await profilePage.newPasswordInput.fill("updated-password")
//       await profilePage.confirmPasswordInput.fill("updated-password")
//       await profilePage.passwordSaveButton.click()
//       await expect(profilePage.passwordSuccessMessage).toBeVisible()
//     })

//     await test.step("logout and log back in", async () => {
//       await profilePage.logoutLink.click()
//       await expect(loginPage.container).toBeVisible()
//       await loginPage.emailInput.fill("test@example.com")
//       await loginPage.passwordInput.fill("updated-password")
//       await loginPage.signInButton.click()
//       await expect(overviewPage.container).toBeVisible()
//     })
//   })

//   test("Check if changing email address updates user correctly", async ({
//     loginPage,
//     accountProfilePage: profilePage,
//     accountOverviewPage: accountPage,
//   }) => {
//     await test.step("Update the user email", async () => {
//       await accountPage.goto()
//       await accountPage.welcomeMessage.waitFor({ state: "visible" })
//       await accountPage.profileLink.click()
//       await profilePage.profileWrapper.waitFor({ state: "visible" })
//       await profilePage.emailEditButton.click()
//       await profilePage.emailInput.fill("test-111@example.com")
//       await profilePage.emailSaveButton.click()
//       await profilePage.emailSuccessMessage.waitFor({ state: "visible" })
//     })

//     await test.step("Try logging in again with the old email", async () => {
//       await profilePage.logoutLink.click()
//       await loginPage.container.waitFor({ state: "visible" })
//       await loginPage.emailInput.fill("test@example.com")
//       await loginPage.passwordInput.fill("password")
//       await loginPage.signInButton.click()
//       await loginPage.errorMessage.waitFor({ state: "visible" })
//     })

//     await test.step("Login with the new email", async () => {
//       await loginPage.emailInput.fill("test-111@example.com")
//       await loginPage.signInButton.click()
//       await accountPage.welcomeMessage.waitFor({ state: "visible" })
//     })

//     await test.step("Set the email back to test@example.com", async () => {
//       await accountPage.profileLink.click()
//       await profilePage.profileWrapper.waitFor({ state: "visible" })
//       await profilePage.emailEditButton.click()
//       await profilePage.emailInput.fill("test@example.com")
//       await profilePage.emailSaveButton.click()
//       await profilePage.emailSuccessMessage.waitFor({ state: "visible" })
//     })

//     await test.step("Try logging out and logging in with the first email", async () => {
//       await profilePage.logoutLink.click()
//       await loginPage.container.waitFor({ state: "visible" })
//       await loginPage.emailInput.fill("test@example.com")
//       await loginPage.passwordInput.fill("password")
//       await loginPage.signInButton.click()
//       await accountPage.welcomeMessage.waitFor({ state: "visible" })
//     })
//   })
// })
